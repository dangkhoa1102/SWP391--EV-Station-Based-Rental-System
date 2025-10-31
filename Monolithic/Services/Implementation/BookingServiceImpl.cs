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
        private readonly PaymentServiceImpl _paymentService;
        private readonly IMapper _mapper;

        public BookingServiceImpl(
            IBookingRepository bookingRepository, 
            ICarRepository carRepository, 
            IStationRepository stationRepository,
           
            //IPaymentService paymentService,
            IMapper mapper)
        {
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _stationRepository = stationRepository;
            
            //_paymentService = paymentService;
            _mapper = mapper;
        }

        #region New Main Booking Flow

        /// <summary>
        /// Step 1: Create booking with deposit payment (Đặt xe + thanh toán đặt cọc)
        /// </summary>
    public async Task<ResponseDto<BookingDto>> CreateBookingAsync(string userId, CreateBookingDto request)
{
    try
    {
        // 1. Validate user ID
        if (!Guid.TryParse(userId, out var userGuid))
            return ResponseDto<BookingDto>.Failure("Invalid user ID");

        // 2. Validate dates
        if (request.PickupDateTime <= DateTime.UtcNow)
            return ResponseDto<BookingDto>.Failure("Pickup date must be in the future");

        if (request.ExpectedReturnDateTime <= request.PickupDateTime)
            return ResponseDto<BookingDto>.Failure("Return date must be after pickup date");

        // 3. Check car availability
        var car = await _carRepository.GetByIdAsync(request.CarId);
        if (car == null || !car.IsActive || !car.IsAvailable)
            return ResponseDto<BookingDto>.Failure("Car not available");

        // 4. Check pickup station
        var pickupStation = await _stationRepository.GetByIdAsync(request.StationId);
        if (pickupStation == null || !pickupStation.IsActive)
            return ResponseDto<BookingDto>.Failure("Pickup station invalid");

        // 5. Check return station if specified
       
        
        // 6. Check for existing active booking for the car
        var hasActiveBooking = await _bookingRepository.HasActiveBookingForCarAsync(request.CarId);
        if (hasActiveBooking)
            return ResponseDto<BookingDto>.Failure("Car already has an active booking");

        // 7. Calculate rental amounts
        var duration = request.ExpectedReturnDateTime - request.PickupDateTime;
        var totalHours = (decimal)duration.TotalHours;
        var totalDays = (decimal)duration.TotalDays;

        decimal hourlyRate = car.RentalPricePerHour;
                decimal dailyRate = car.RentalPricePerDay;
        decimal totalAmount = totalDays >= 1 ? Math.Ceiling(totalDays) * dailyRate : Math.Ceiling(totalHours) * hourlyRate;
        totalAmount = Math.Round(totalAmount, 2);
        decimal depositAmount = Math.Round(totalAmount * 0.3m, 2);

        // 8. Create booking entity (Payment is not handled here)
        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            UserId = userGuid,
            CarId = request.CarId,
            StationId = request.StationId,
            StartTime = request.PickupDateTime,
            EndTime = request.ExpectedReturnDateTime,
            HourlyRate = hourlyRate,
            DailyRate = dailyRate,
            TotalAmount = totalAmount,
            DepositAmount = depositAmount,
            BookingStatus = BookingStatus.Pending, // waiting for payment
            IsContractApproved = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 9. Save booking
        var createdBooking = await _bookingRepository.AddAsync(booking);

        // 10. Update car status to reserved (optional: only after payment?)
        await _carRepository.UpdateCarStatusAsync(request.CarId, false);

        return ResponseDto<BookingDto>.Success(
            _mapper.Map<BookingDto>(createdBooking),
            "Booking created successfully. Please proceed to deposit payment to confirm your booking."
        );
    }
    catch (Exception ex)
    {
        return ResponseDto<BookingDto>.Failure($"Error creating booking: {ex.Message}");
    }
}

        public async Task<ResponseDto<BookingDto>> CheckInWithContractAsync(CheckInWithContractDto request)
        {
            // 1️⃣ Lấy thông tin booking
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null || !booking.IsActive)
                return ResponseDto<BookingDto>.Failure("Booking not found");

            if (booking.BookingStatus != BookingStatus.DepositPaid)
                return ResponseDto<BookingDto>.Failure($"Cannot check-in booking with status: {booking.BookingStatus}");

            // 2️⃣ Kiểm tra thời gian hợp lệ (±60 phút)
            var timeDifference = Math.Abs((DateTime.UtcNow - booking.StartTime).TotalMinutes);
            if (timeDifference > 60)
                return ResponseDto<BookingDto>.Failure("Check-in time is outside the allowed window");

            // 3️⃣ Cập nhật thông tin check-in
            booking.CheckInAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.BookingStatus = BookingStatus.CheckedInPendingPayment;

            // 4️⃣ Cập nhật slot trống của station (xe đã rời đi)
            var stationUpdateResult = await _stationRepository.UpdateAvailableSlotsAsync(booking.StationId, +1);
            if (!stationUpdateResult)
                return ResponseDto<BookingDto>.Failure("Failed to update station slots");

            // 5️⃣ Cập nhật DB
            var updated = await _bookingRepository.UpdateAsync(booking);

            // 6️⃣ Không tạo payment ở đây, FE hoặc Payment API sẽ gọi:
            // PaymentType = Rental (100% rental cost)
            // Tổng tiền thực tế lúc này = Deposit (30%) + Rental (100%) = 130%
            return ResponseDto<BookingDto>.Success(
                _mapper.Map<BookingDto>(updated),
                $"Check-in successful. Please proceed to full rental payment ({booking.TotalAmount:C})."
            );
        }



        /// <summary>
        /// Step 5: Check-out with rental payment (Check-out + thanh toán tiền thuê)
        /// </summary>
        public async Task<ResponseDto<BookingDto>> CheckOutBookingAsync(CheckOutWithPaymentDto request)
        {
            try
            {
                // 1️⃣ Validate booking
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null || !booking.IsActive)
                    return ResponseDto<BookingDto>.Failure("Booking not found.");

                if (booking.BookingStatus != BookingStatus.CheckedIn)
                    return ResponseDto<BookingDto>.Failure($"Cannot checkout booking with status: {booking.BookingStatus}");

                // 2️⃣ Ghi nhận dữ liệu thực tế khi trả xe
                booking.ActualReturnDateTime = request.ActualReturnDateTime ?? DateTime.UtcNow;
                booking.CheckOutNotes = request.CheckOutNotes;
                booking.CheckOutPhotoUrl = request.CheckOutPhotoUrl;
                booking.DamageFee = Math.Round(request.DamageFee, 2);
                booking.UpdatedAt = DateTime.UtcNow;

                var actualReturn = booking.ActualReturnDateTime.Value;
                var expectedReturn = booking.EndTime ?? booking.StartTime.AddHours(1);
                var graceMinutes = 30;

                // 3️⃣ Tính số giờ thuê thực tế
                var totalHours = Math.Ceiling((actualReturn - booking.StartTime).TotalHours);
                if (totalHours < 1) totalHours = 1;
                booking.RentalAmount = Math.Round((decimal)totalHours * booking.HourlyRate, 2);

                // 4️⃣ Tính phí trễ (nếu có)
                booking.LateFee = 0;
                if (actualReturn > expectedReturn.AddMinutes(graceMinutes))
                {
                    var delayMinutes = (actualReturn - expectedReturn).TotalMinutes;
                    var hoursLate = (decimal)delayMinutes / 60m;
                    booking.LateFee = Math.Round(hoursLate * booking.HourlyRate, 2);
                }

                // 5️⃣ Tổng tiền thực tế cuối cùng
                var finalAmount = booking.RentalAmount + booking.LateFee + booking.DamageFee;
                booking.TotalAmount = Math.Round(finalAmount, 2);

                // 6️⃣ So sánh với tổng 100% rental (đã thanh toán lúc check-in)
                var rentalPaid = booking.TotalAmount - booking.DepositAmount; // rental đã trả lúc check-in
                var difference = finalAmount - rentalPaid;

                // 7️⃣ Nếu difference > 0 → Extra; < 0 → Refund
                booking.ExtraAmount = difference > 0 ? Math.Round(difference, 2) : 0;
                booking.RefundAmount = difference < 0 ? Math.Round(-difference, 2) : 0;
                booking.DepositRefunded = booking.RefundAmount > 0;

                // 8️⃣ Ghi nhận toán cuối
                booking.FinalPaymentAmount = Math.Round(difference, 2);
                booking.BookingStatus = BookingStatus.CheckedOutPendingPayment;
                booking.UpdatedAt = DateTime.UtcNow;

                // 9️⃣ Lưu thay đổi
                var updatedBooking = await _bookingRepository.UpdateAsync(booking);
                var bookingDto = _mapper.Map<BookingDto>(updatedBooking);

                // 🔟 Tạo message phản hồi
                string message = bookingDto.FinalPaymentAmount switch
                {
                    > 0 => $"Checkout complete. Extra payment required: {bookingDto.ExtraAmount:C}. Please call Payment API with PaymentType = Extra.",
                    < 0 => $"Checkout complete. Refund to process: {bookingDto.RefundAmount:C}. Please call Payment API with PaymentType = Refund.",
                    _ => "Checkout complete. No extra payment or refund required."
                };

                return ResponseDto<BookingDto>.Success(bookingDto, message);
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during checkout: {ex.Message}");
            }
        }



        public async Task<ResponseDto<string>> CancelBookingAsync(Guid id, string userId, string? reason = null)
        {
            try
            {
                // 1️⃣ Lấy booking + validate
                var booking = await _bookingRepository.GetByIdAsync(id);
                if (booking == null || !booking.IsActive)
                    return ResponseDto<string>.Failure("Booking not found.");

                if (!Guid.TryParse(userId, out var userGuid) || booking.UserId != userGuid)
                    return ResponseDto<string>.Failure("Unauthorized to cancel this booking.");

                if (booking.BookingStatus is BookingStatus.Completed or BookingStatus.Cancelled)
                    return ResponseDto<string>.Failure("Cannot cancel booking in current status.");

                var now = DateTime.UtcNow;
                var hoursBeforePickup = (booking.StartTime - now).TotalHours;

                // 2️⃣ Tính toán refund (nếu có)
                booking.RefundAmount = 0;
                booking.ExtraAmount = 0;
                booking.DepositRefunded = false;

                string message;

                // Case 1: Cancel > 24h before pickup → refund deposit
                if (hoursBeforePickup > 24)
                {
                    booking.RefundAmount = booking.DepositAmount;
                    booking.DepositRefunded = true;

                    message = $"Booking cancelled successfully. Refund of {booking.RefundAmount:C} required. Please call Payment API with PaymentType = Refund.";
                }
                // Case 2: Cancel ≤ 24h → no refund
                else
                {
                    message = "Booking cancelled successfully. Deposit forfeited due to late cancellation.";
                }

                // 3️⃣ Cập nhật trạng thái booking
                booking.BookingStatus = BookingStatus.Cancelled;
                booking.IsActive = false;
                booking.UpdatedAt = now;

                await _bookingRepository.UpdateAsync(booking);
                await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

                // 4️⃣ Trả kết quả
                return ResponseDto<string>.Success("", message);
            }
            catch (Exception ex)
            {
                return ResponseDto<string>.Failure($"Error cancelling booking: {ex.Message}");
            }
        }


        public async Task AutoCancelNoShowBookingsAsync()
        {
            var now = DateTime.UtcNow;
            // Assuming repository method that fetches pending or deposit paid bookings scheduled to start in the past
            var pendingBookings = await _bookingRepository.FindAsync(b => b.IsActive &&
                (b.BookingStatus == BookingStatus.Pending || b.BookingStatus == BookingStatus.DepositPaid) &&
                b.StartTime.AddHours(1) < now);

            foreach (var b in pendingBookings)
            {
                b.BookingStatus = BookingStatus.Cancelled;
                b.IsActive = false;
                b.UpdatedAt = now;
                await _bookingRepository.UpdateAsync(b);

                // deposit forfeited — optionally create a note/payment record that no refund made
                // free car
                await _carRepository.UpdateCarStatusAsync(b.CarId, true);
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
                //if (request.ReturnStationId.HasValue)
                //    booking.ReturnStationId = request.ReturnStationId.Value;
                
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
                    (b.BookingStatus == BookingStatus.DepositPaid || b.BookingStatus == BookingStatus.CheckedIn) &&
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