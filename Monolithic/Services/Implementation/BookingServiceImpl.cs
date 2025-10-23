using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Payment;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class BookingServiceImpl : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly ICarRepository _carRepository;
        private readonly IStationRepository _stationRepository;
        private readonly IPaymentService _paymentService;
        private readonly IMapper _mapper;

        public BookingServiceImpl(
            IBookingRepository bookingRepository, 
            ICarRepository carRepository, 
            IStationRepository stationRepository, 
            IPaymentService paymentService,
            IMapper mapper)
        {
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _stationRepository = stationRepository;
            _paymentService = paymentService;
            _mapper = mapper;
        }

        #region New Main Booking Flow

        /// <summary>
        /// Step 1: Create booking with deposit payment (Đặt xe + thanh toán đặt cọc)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CreateBookingWithDepositAsync(string userId, CreateBookingDto request)
        {
            try
            {
                // Validate user ID
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return ResponseDto<BookingDto>.Failure("Invalid user ID");
                }

                // Validate dates
                if (request.PickupDateTime <= DateTime.UtcNow)
                {
                    return ResponseDto<BookingDto>.Failure("Pickup date must be in the future");
                }

                if (request.ExpectedReturnDateTime <= request.PickupDateTime)
                {
                    return ResponseDto<BookingDto>.Failure("Return date must be after pickup date");
                }

                // Check car availability
                var car = await _carRepository.GetByIdAsync(request.CarId);
                if (car == null || !car.IsActive || !car.IsAvailable)
                {
                    return ResponseDto<BookingDto>.Failure("Car not available");
                }

                // Check pickup station
                var pickupStation = await _stationRepository.GetByIdAsync(request.PickupStationId);
                if (pickupStation == null || !pickupStation.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Pickup station invalid");
                }

                // Check return station if specified
                if (request.ReturnStationId.HasValue)
                {
                    var returnStation = await _stationRepository.GetByIdAsync(request.ReturnStationId.Value);
                    if (returnStation == null || !returnStation.IsActive)
                    {
                        return ResponseDto<BookingDto>.Failure("Return station invalid");
                    }
                }

                // Check if car already has active booking
                var hasActiveBooking = await _bookingRepository.HasActiveBookingForCarAsync(request.CarId);
                if (hasActiveBooking)
                {
                    return ResponseDto<BookingDto>.Failure("Car already has an active booking");
                }

                // Calculate pricing
                var duration = request.ExpectedReturnDateTime - request.PickupDateTime;
                var totalHours = (decimal)duration.TotalHours;
                var totalDays = (decimal)duration.TotalDays;

                decimal hourlyRate = car.RentalPricePerHour;
                decimal dailyRate = hourlyRate * 20; // Assume daily rate is 20x hourly rate
                decimal totalAmount;

                if (totalDays >= 1)
                {
                    totalAmount = Math.Ceiling(totalDays) * dailyRate;
                }
                else
                {
                    totalAmount = Math.Ceiling(totalHours) * hourlyRate;
                }

                // Calculate deposit (30% of total amount)
                decimal depositAmount = Math.Round(totalAmount * 0.3m, 2);
                decimal rentalAmount = totalAmount - depositAmount;

                // Create payment for deposit
                var createPaymentRequest = new CreatePaymentDto
                {
                    BookingId = Guid.NewGuid(), // Will be updated after booking creation
                    Amount = depositAmount,
                    PaymentMethod = Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var method) ? method : PaymentMethod.Cash,
                    PaymentType = "Deposit",
                    Description = $"Deposit payment for booking",
                    ReturnUrl = null,
                    CancelUrl = null
                };

                // For non-cash payments, process through gateway
                if (request.PaymentMethod.ToLower() != "cash")
                {
                    var paymentResult = await _paymentService.CreatePaymentAsync(createPaymentRequest);
                    if (!paymentResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to create deposit payment: {paymentResult.Message}");
                    }

                    var processResult = await _paymentService.ProcessPaymentAsync(paymentResult.Data.PaymentId);
                    if (!processResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to process deposit payment: {processResult.Message}");
                    }

                    // Confirm payment with transaction ID
                    var confirmPaymentRequest = new ConfirmPaymentDto
                    {
                        PaymentId = paymentResult.Data.PaymentId,
                        TransactionId = request.TransactionId ?? "",
                        GatewayResponse = null
                    };

                    var confirmResult = await _paymentService.ConfirmPaymentAsync(confirmPaymentRequest);
                    if (!confirmResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to confirm deposit payment: {confirmResult.Message}");
                    }
                }

                // Create booking entity
                var booking = new Booking
                {
                    BookingId = Guid.NewGuid(),
                    UserId = userGuid,
                    CarId = request.CarId,
                    PickupStationId = request.PickupStationId,
                    ReturnStationId = request.ReturnStationId,
                    StartTime = request.PickupDateTime,
                    EndTime = request.ExpectedReturnDateTime,
                    BookingStatus = BookingStatus.DepositPaid,
                    HourlyRate = hourlyRate,
                    DailyRate = dailyRate,
                    TotalAmount = totalAmount,
                    DepositAmount = depositAmount,
                    RentalAmount = rentalAmount,
                    PaymentStatus = "DepositPaid",
                    PaymentMethod = request.PaymentMethod,
                    DepositTransactionId = request.TransactionId,
                    IsContractApproved = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Save booking
                var created = await _bookingRepository.AddAsync(booking);

                // Update car status to reserved
                await _carRepository.UpdateCarStatusAsync(request.CarId, false);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(created), "Booking created and deposit paid successfully. Please review and approve the contract.");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error creating booking: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 2: Approve contract (Approve hợp đồng)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> ApproveContractAsync(ApproveContractDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.DepositPaid)
                {
                    return ResponseDto<BookingDto>.Failure($"Cannot approve contract for booking with status: {booking.BookingStatus}");
                }

                if (!request.ApproveContract)
                {
                    // User rejected contract, cancel booking and refund deposit
                    booking.BookingStatus = BookingStatus.Cancelled;
                    booking.PaymentStatus = "Refunded";
                    booking.UpdatedAt = DateTime.UtcNow;

                    await _bookingRepository.UpdateAsync(booking);
                    await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

                    return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(booking), "Contract rejected. Booking cancelled and deposit will be refunded.");
                }

                // Approve contract
                booking.BookingStatus = BookingStatus.ContractApproved;
                booking.IsContractApproved = true;
                booking.ContractApprovedAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Contract approved successfully. You can now proceed to check-in.");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error approving contract: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 3: Check-in with contract signing (Check-in + ký hợp đồng)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CheckInWithContractAsync(CheckInWithContractDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.ContractApproved)
                {
                    return ResponseDto<BookingDto>.Failure($"Cannot check-in booking with status: {booking.BookingStatus}");
                }

                // Check if it's within pickup time window (e.g., within 1 hour of scheduled time)
                var timeDifference = Math.Abs((DateTime.UtcNow - booking.StartTime).TotalMinutes);
                if (timeDifference > 60) // Allow 1 hour flexibility
                {
                    return ResponseDto<BookingDto>.Failure("Check-in time is outside the allowed window");
                }

                // Update booking with check-in details
                booking.BookingStatus = BookingStatus.CheckedIn;
                booking.CheckInAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                // TODO: Create contract record with signatures
                // This would involve creating a Contract entity with the signatures

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Check-in completed and contract signed successfully. Enjoy your ride!");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during check-in: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 5: Check-out with rental payment (Check-out + thanh toán tiền thuê)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CheckOutWithPaymentAsync(CheckOutWithPaymentDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.CheckedIn)
                {
                    return ResponseDto<BookingDto>.Failure($"Cannot check-out booking with status: {booking.BookingStatus}");
                }

                // Calculate total rental amount including fees
                decimal totalRentalAmount = booking.RentalAmount + request.LateFee + request.DamageFee;

                // Create payment for rental
                var createPaymentRequest = new CreatePaymentDto
                {
                    BookingId = request.BookingId,
                    Amount = totalRentalAmount,
                    PaymentMethod = Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var method) ? method : PaymentMethod.Cash,
                    PaymentType = "Rental",
                    Description = $"Rental payment for booking {request.BookingId}",
                    ReturnUrl = null,
                    CancelUrl = null
                };

                // For non-cash payments, process through gateway
                if (request.PaymentMethod.ToLower() != "cash")
                {
                    var paymentResult = await _paymentService.CreatePaymentAsync(createPaymentRequest);
                    if (!paymentResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to create rental payment: {paymentResult.Message}");
                    }

                    var processResult = await _paymentService.ProcessPaymentAsync(paymentResult.Data.PaymentId);
                    if (!processResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to process rental payment: {processResult.Message}");
                    }

                    // Confirm payment with transaction ID
                    var confirmPaymentRequest = new ConfirmPaymentDto
                    {
                        PaymentId = paymentResult.Data.PaymentId,
                        TransactionId = request.TransactionId ?? "",
                        GatewayResponse = null
                    };

                    var confirmResult = await _paymentService.ConfirmPaymentAsync(confirmPaymentRequest);
                    if (!confirmResult.IsSuccess)
                    {
                        return ResponseDto<BookingDto>.Failure($"Failed to confirm rental payment: {confirmResult.Message}");
                    }
                }

                // Update booking with check-out details
                booking.BookingStatus = BookingStatus.Completed;
                booking.CheckOutAt = DateTime.UtcNow;
                booking.ActualReturnDateTime = DateTime.UtcNow;
                booking.PaymentStatus = "Completed";
                booking.RentalTransactionId = request.TransactionId;
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                // Make car available again
                await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Check-out completed and rental payment processed successfully. Thank you for using our service!");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during check-out: {ex.Message}");
            }
        }

        #endregion

        #region Booking Management

        public async Task<ResponseDto<PaginationDto<BookingDto>>> GetBookingsAsync(PaginationRequestDto request)
        {
            try
            {
                Expression<Func<Booking, bool>> predicate = b => b.IsActive;
                var (items, total) = await _bookingRepository.GetPagedAsync(request.Page, request.PageSize, predicate, b => b.CreatedAt, true);
                var dto = _mapper.Map<List<BookingDto>>(items);
                var pagination = new PaginationDto<BookingDto>(dto, request.Page, request.PageSize, total);
                return ResponseDto<PaginationDto<BookingDto>>.Success(pagination);
            }
            catch (Exception ex)
            {
                return ResponseDto<PaginationDto<BookingDto>>.Failure($"Error getting bookings: {ex.Message}");
            }
        }

        public async Task<ResponseDto<BookingDto>> GetBookingByIdAsync(Guid id)
        {
            try
            {
                var booking = await _bookingRepository.GetBookingWithDetailsAsync(id);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }
                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(booking));
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error getting booking: {ex.Message}");
            }
        }

        public async Task<ResponseDto<List<BookingDto>>> GetUserBookingsAsync(string userId)
        {
            try
            {
                var items = await _bookingRepository.GetUserBookingsAsync(userId);
                return ResponseDto<List<BookingDto>>.Success(_mapper.Map<List<BookingDto>>(items));
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingDto>>.Failure($"Error getting user bookings: {ex.Message}");
            }
        }

        public async Task<ResponseDto<BookingDto>> UpdateBookingAsync(Guid id, UpdateBookingDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(id);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                // Only allow updates for Pending or DepositPaid bookings
                if (booking.BookingStatus != BookingStatus.Pending && booking.BookingStatus != BookingStatus.DepositPaid)
                {
                    return ResponseDto<BookingDto>.Failure("Cannot update booking in current status");
                }

                // Update fields
                if (request.ReturnStationId.HasValue)
                    booking.ReturnStationId = request.ReturnStationId.Value;
                
                if (request.ExpectedReturnDateTime.HasValue)
                    booking.EndTime = request.ExpectedReturnDateTime.Value;
                
                if (request.BookingStatus.HasValue)
                    booking.BookingStatus = request.BookingStatus.Value;

                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);
                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking updated successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error updating booking: {ex.Message}");
            }
        }

        public async Task<ResponseDto<string>> CancelBookingAsync(Guid id, string userId, string? reason = null)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(id);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<string>.Failure("Booking not found");
                }

                if (!Guid.TryParse(userId, out var userGuid) || booking.UserId != userGuid)
                {
                    return ResponseDto<string>.Failure("Unauthorized to cancel this booking");
                }

                if (booking.BookingStatus == BookingStatus.Completed || booking.BookingStatus == BookingStatus.Cancelled)
                {
                    return ResponseDto<string>.Failure("Cannot cancel booking in current status");
                }

                // Update booking status
                booking.BookingStatus = BookingStatus.Cancelled;
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // Make car available again
                await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

                return ResponseDto<string>.Success("", "Booking cancelled successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<string>.Failure($"Error cancelling booking: {ex.Message}");
            }
        }

        #endregion

        #region Utility Methods

        public async Task<ResponseDto<bool>> CheckCarAvailabilityAsync(CheckAvailabilityDto request)
        {
            try
            {
                var car = await _carRepository.GetByIdAsync(request.CarId);
                if (car == null || !car.IsActive)
                {
                    return ResponseDto<bool>.Success(false, "Car not found or inactive");
                }

                if (!car.IsAvailable)
                {
                    return ResponseDto<bool>.Success(false, "Car not available");
                }

                // Check for overlapping bookings
                var hasActiveBooking = await _bookingRepository.HasActiveBookingForCarAsync(request.CarId);
                return ResponseDto<bool>.Success(!hasActiveBooking);
            }
            catch (Exception ex)
            {
                return ResponseDto<bool>.Failure($"Error checking availability: {ex.Message}");
            }
        }

        public async Task<ResponseDto<decimal>> CalculateBookingCostAsync(Guid carId, DateTime startTime, DateTime endTime)
        {
            try
            {
                if (endTime <= startTime)
                {
                    return ResponseDto<decimal>.Failure("End time must be after start time");
                }

                var car = await _carRepository.GetByIdAsync(carId);
                if (car == null || !car.IsActive)
                {
                    return ResponseDto<decimal>.Failure("Car not found");
                }

                var duration = endTime - startTime;
                var totalHours = (decimal)duration.TotalHours;
                var totalDays = (decimal)duration.TotalDays;

                decimal cost;
                if (totalDays >= 1)
                {
                    // Use daily rate
                    var dailyRate = car.RentalPricePerHour * 20; // Assume daily rate is 20x hourly
                    cost = Math.Ceiling(totalDays) * dailyRate;
                }
                else
                {
                    // Use hourly rate
                    cost = Math.Ceiling(totalHours) * car.RentalPricePerHour;
                }

                return ResponseDto<decimal>.Success(Math.Round(cost, 2));
            }
            catch (Exception ex)
            {
                return ResponseDto<decimal>.Failure($"Error calculating cost: {ex.Message}");
            }
        }

        public async Task<ResponseDto<BookingStatusDto>> GetActiveBookingAsync(string userId)
        {
            try
            {
                var booking = await _bookingRepository.GetActiveBookingByUserAsync(userId);
                if (booking == null)
                {
                    return ResponseDto<BookingStatusDto>.Failure("No active booking found");
                }
                return ResponseDto<BookingStatusDto>.Success(_mapper.Map<BookingStatusDto>(booking));
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingStatusDto>.Failure($"Error getting active booking: {ex.Message}");
            }
        }

        public async Task<ResponseDto<List<BookingHistoryDto>>> GetBookingHistoryAsync(string userId)
        {
            try
            {
                var bookings = await _bookingRepository.GetUserBookingsAsync(userId);
                var completedBookings = bookings.Where(b => b.BookingStatus == BookingStatus.Completed).ToList();
                return ResponseDto<List<BookingHistoryDto>>.Success(_mapper.Map<List<BookingHistoryDto>>(completedBookings));
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingHistoryDto>>.Failure($"Error getting booking history: {ex.Message}");
            }
        }

        public async Task<ResponseDto<List<BookingDto>>> GetUpcomingBookingsAsync()
        {
            try
            {
                // Get bookings that are confirmed or checked-in and pickup time is in the future
                var upcomingBookings = await _bookingRepository.FindAsync(b => 
                    b.IsActive && 
                    (b.BookingStatus == BookingStatus.ContractApproved || b.BookingStatus == BookingStatus.CheckedIn) &&
                    b.StartTime >= DateTime.UtcNow);
                
                var orderedBookings = upcomingBookings.OrderBy(b => b.StartTime).Take(100).ToList();
                return ResponseDto<List<BookingDto>>.Success(_mapper.Map<List<BookingDto>>(orderedBookings));
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingDto>>.Failure($"Error getting upcoming bookings: {ex.Message}");
            }
        }

        #endregion
    }
}