using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
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
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public BookingServiceImpl(IBookingRepository bookingRepository, ICarRepository carRepository, IStationRepository stationRepository, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _stationRepository = stationRepository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        #region Main Booking Flow

        /// <summary>
        /// Step 1: Create a new booking (Đặt xe)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CreateBookingAsync(string userId, CreateBookingDto request)
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
                decimal dailyRate = hourlyRate * 20; // Assume daily rate is 20x hourly rate or get from car model
                decimal totalAmount;

                if (totalDays >= 1)
                {
                    // Use daily rate for rentals >= 1 day
                    totalAmount = Math.Ceiling(totalDays) * dailyRate;
                }
                else
                {
                    // Use hourly rate for short rentals
                    totalAmount = Math.Ceiling(totalHours) * hourlyRate;
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
                    BookingStatus = BookingStatus.Pending,
                    HourlyRate = hourlyRate,
                    DailyRate = dailyRate,
                    TotalAmount = totalAmount,
                    PaymentStatus = "Pending",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                //// Save booking
                //var created = await _bookingRepository.AddAsync(booking);

                //// Update car status to reserved
                //await _carRepository.UpdateCarStatusAsync(request.CarId, false);

                //return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(created), "Booking created successfully. Please proceed to payment.");
                // ✨ BƯỚC QUAN TRỌNG: TẠO VÀ LIÊN KẾT HỢP ĐỒNG ✨
                var newContract = new Contract
                {
                    Id = Guid.NewGuid(),
                    SoHopDong = $"HD-{DateTime.UtcNow:yyyyMMdd}-{booking.BookingId.ToString().Substring(0, 4)}",
                    Status = ContractStatus.Pending, // Trạng thái chờ ký
                    NgayTao = DateTime.UtcNow,
                    // Bạn có thể thêm các thông tin khác nếu cần
                };

                // Liên kết Contract với Booking thông qua Navigation Property
                // EF Core sẽ tự động hiểu newContract.BookingId = booking.BookingId
                booking.Contract = newContract;

                // BẮT ĐẦU GIAO DỊCH
                // 1. Thêm booking vào context (EF sẽ tự động thêm cả contract)
                await _bookingRepository.AddAsync(booking);

                // 2. Cập nhật trạng thái xe (chỉ thay đổi trong context)
                car.IsAvailable = false;
                await _carRepository.UpdateAsync(car); // Giả sử có phương thức UpdateAsync không gọi SaveChanges

                // 3. ✅ GỌI SAVECHANGES MỘT LẦN DUY NHẤT ✅
                // Đây là lúc tất cả thay đổi (tạo booking, tạo contract, cập nhật xe)
                // được ghi xuống database trong một giao dịch.
                await _unitOfWork.SaveChangesAsync();

                // Ánh xạ booking đã được tạo (giờ đã có ID) sang DTO
                var bookingDto = _mapper.Map<BookingDto>(booking);
                return ResponseDto<BookingDto>.Success(bookingDto, "Booking created successfully. Please proceed to payment.");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error creating booking: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 2: Confirm booking after payment
        /// </summary>
        public async Task<ResponseDto<BookingDto>> ConfirmBookingAsync(ConfirmBookingDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.Pending)
                {
                    return ResponseDto<BookingDto>.Failure($"Cannot confirm booking with status: {booking.BookingStatus}");
                }

                // Update booking status and payment info
                booking.BookingStatus = BookingStatus.Confirmed;
                booking.PaymentStatus = "Paid";
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking confirmed successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error confirming booking: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 3: Check-in process (Nhận xe)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CheckInAsync(CheckInDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.Confirmed)
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
                // Note: CheckInDateTime should be added to your model if needed
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Check-in completed successfully. Enjoy your ride!");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during check-in: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 4: Check-out process (Trả xe)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CheckOutAsync(CheckOutDto request)
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

                // Update booking with check-out details
                booking.BookingStatus = BookingStatus.CheckedOut;
                booking.ActualReturnDateTime = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                // Make car available again
                await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Check-out completed successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during check-out: {ex.Message}");
            }
        }

        /// <summary>
        /// Step 5: Complete booking
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CompleteBookingAsync(Guid bookingId)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null || !booking.IsActive)
                {
                    return ResponseDto<BookingDto>.Failure("Booking not found");
                }

                if (booking.BookingStatus != BookingStatus.CheckedOut)
                {
                    return ResponseDto<BookingDto>.Failure($"Cannot complete booking with status: {booking.BookingStatus}");
                }

                // Update booking status
                booking.BookingStatus = BookingStatus.Completed;
                booking.PaymentStatus = "Completed";
                booking.UpdatedAt = DateTime.UtcNow;

                var updated = await _bookingRepository.UpdateAsync(booking);

                return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking completed successfully. Thank you for using our service!");
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error completing booking: {ex.Message}");
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

                // Only allow updates for Pending or Confirmed bookings
                if (booking.BookingStatus != BookingStatus.Pending && booking.BookingStatus != BookingStatus.Confirmed)
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
                    (b.BookingStatus == BookingStatus.Confirmed || b.BookingStatus == BookingStatus.CheckedIn) &&
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