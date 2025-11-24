using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Car;
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
        private readonly IContractRepository _contractRepository;

        public BookingServiceImpl(
            IBookingRepository bookingRepository,
            ICarRepository carRepository,
            IStationRepository stationRepository,
            IContractRepository contractRepository,

            //IPaymentService paymentService,
            IMapper mapper)
        {
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _stationRepository = stationRepository;
            _contractRepository = contractRepository;

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
                if (request.PickupDateTime <= DateTime.Now)
                    return ResponseDto<BookingDto>.Failure("Pickup date must be in the future");

                if (request.ExpectedReturnDateTime <= request.PickupDateTime)
                    return ResponseDto<BookingDto>.Failure("Return date must be after pickup date");

                // 3. Check car availability
                var car = await _carRepository.GetByIdAsync(request.CarId);
                //if (car == null || !car.IsActive || !car.IsAvailable)
                //    return ResponseDto<BookingDto>.Failure("Car not available");

                // 4. Check pickup station
                var pickupStation = await _stationRepository.GetByIdAsync(request.StationId);
                if (pickupStation == null || !pickupStation.IsActive)
                    return ResponseDto<BookingDto>.Failure("Pickup station invalid");

                // 5. Check return station if specified


                var isAvailable = await IsCarAvailableDuringPeriodAsync(request.CarId, request.PickupDateTime, request.ExpectedReturnDateTime);
                if (!isAvailable)
                    return ResponseDto<BookingDto>.Failure("Car already has an active booking during the selected period");

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
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                // 9. Save booking
                var createdBooking = await _bookingRepository.AddAsync(booking);

                // 10. Update car status to reserved (optional: only after payment?)
                //await _carRepository.UpdateCarStatusAsync(request.CarId, false);

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

        public async Task<ResponseDto<BookingDto>> CheckInWithContractAsync(CheckInWithContractDto request, string? callerUserId, IFormFile? checkInPhoto)
        {
            // 1️⃣ Lấy thông tin booking
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null || !booking.IsActive)
                return ResponseDto<BookingDto>.Failure("Booking not found");

            if (booking.BookingStatus != BookingStatus.DepositPaid)
                return ResponseDto<BookingDto>.Failure($"Cannot check-in booking with status: {booking.BookingStatus}");
            // Early and late grace windows
            int earlyGraceMinutes = 60;   // Cho check-in sớm 1 tiếng
            int lateGraceMinutes = 60;    // Cho check-in trễ 1 tiếng

            var nowLocal = DateTime.Now;  // dùng giờ local VN
            var earliestAllowed = booking.StartTime.AddMinutes(-earlyGraceMinutes);
            var latestAllowed = booking.StartTime.AddMinutes(lateGraceMinutes);

            // Too early
            if (nowLocal < earliestAllowed)
            {
                return ResponseDto<BookingDto>.Failure(
                    $"Too early to check in. Allowed from: {earliestAllowed:yyyy-MM-dd HH:mm}."
                );
            }

            // Too late
            if (nowLocal > latestAllowed)
            {
                return ResponseDto<BookingDto>.Failure(
                    $"Too late to check in. Allowed until: {latestAllowed:yyyy-MM-dd HH:mm}."
                );
            }


            // Verify caller identity from JWT
            if (string.IsNullOrEmpty(callerUserId) || !Guid.TryParse(callerUserId, out var callerGuid))
            {
                return ResponseDto<BookingDto>.Failure("Unauthorized");
            }

            //2️⃣ Kiểm tra hợp đồng liên quan
            var contract = await _contractRepository.GetByBookingIdAsync(request.BookingId);
            if (contract == null)
            {
                return ResponseDto<BookingDto>.Failure("Contract not found for this booking");
            }

            if (!contract.IsConfirmed)
            {
                return ResponseDto<BookingDto>.Failure("Contract not confirmed");
            }

            // if (contract.RenterId != callerGuid)
            // {
            //     return ResponseDto<BookingDto>.Failure("Forbidden: caller is not the renter who signed the contract");
            // }

            // 3️⃣ Handle photo upload if provided
            string? checkInPhotoUrl = null;
            if (checkInPhoto != null && checkInPhoto.Length > 0)
            {
                try
                {
                    // Validate file
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                    var fileExtension = Path.GetExtension(checkInPhoto.FileName).ToLowerInvariant();
                    if (!allowedExtensions.Contains(fileExtension))
                        return ResponseDto<BookingDto>.Failure("Invalid file type. Only images are allowed.");

                    if (checkInPhoto.Length > 5 * 1024 * 1024) // 5MB max
                        return ResponseDto<BookingDto>.Failure("File size exceeds 5MB limit.");

                    // Save file
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "check-in-photos");
                    Directory.CreateDirectory(uploadsFolder);
                    
                    var uniqueFileName = $"{request.BookingId}_{DateTime.Now:yyyyMMdd_HHmmss}{fileExtension}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                    
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await checkInPhoto.CopyToAsync(fileStream);
                    }

                    checkInPhotoUrl = $"/uploads/check-in-photos/{uniqueFileName}";
                }
                catch (Exception ex)
                {
                    return ResponseDto<BookingDto>.Failure($"Error uploading photo: {ex.Message}");
                }
            }

            // 4️⃣ Cập nhật thông tin check-in trên booking
            booking.CheckInAt = DateTime.Now;
            booking.UpdatedAt = DateTime.Now;
            booking.BookingStatus = BookingStatus.CheckedInPendingPayment;
            booking.IsContractApproved = true;
            booking.ContractApprovedAt = DateTime.Now;
            booking.CheckInPhotoUrl = checkInPhotoUrl;

            //5️⃣ Cập nhật slot trống của station(xe đã rời đi)
            var stationUpdateResult = await _stationRepository.UpdateAvailableSlotsAsync(booking.StationId, +1);
            if (!stationUpdateResult)
                return ResponseDto<BookingDto>.Failure("Failed to update station slots");

            // 6️⃣ CẬP NHẬT DB
            var updated = await _bookingRepository.UpdateAsync(booking);

            // 7️⃣ Đọc lại slots hiện tại của station để xác nhận
            var stationAfterUpdate = await _stationRepository.GetByIdAsync(booking.StationId);

            // 8️⃣ Không tạo payment ở đây, FE hoặc Payment API sẽ gọi:
            // PaymentType = Rental (100% rental cost)
            // Tổng tiền thực tế lúc này = Deposit (30%) + Rental (100%) = 130%
            return ResponseDto<BookingDto>.Success(
                _mapper.Map<BookingDto>(updated),
                stationAfterUpdate != null
                    ? $"Check-in successful. Station slots: {stationAfterUpdate.AvailableSlots}/{stationAfterUpdate.TotalSlots}. Please proceed to full rental payment ({booking.TotalAmount:C})."
                    : $"Check-in successful. Please proceed to full rental payment ({booking.TotalAmount:C})."
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
             

              
                // 2️⃣ Record actual return info
                booking.ActualReturnDateTime = request.ActualReturnDateTime ?? DateTime.Now;
                booking.CheckOutNotes = request.CheckOutNotes;
                booking.CheckOutPhotoUrl = request.CheckOutPhotoUrl;
                booking.DamageFee = Math.Round(request.DamageFee, 2);
                booking.UpdatedAt = DateTime.Now;

              
                var actualReturn = booking.ActualReturnDateTime.Value;
                if (actualReturn < booking.StartTime)
                    return ResponseDto<BookingDto>.Failure("Actual return date cannot be earlier than pickup date.");

               
                // 3️⃣ Setup rental parameters
                var expectedReturn = booking.EndTime ?? booking.StartTime.AddHours(1);
                var graceMinutes = 30;

                

              
                    if (booking.RentalAmount <= 0)
                    {
                       
                        // fallback: if missing, calculate based on duration and rates
                        var duration = (booking.EndTime ?? booking.StartTime.AddHours(1)) - booking.StartTime;
                        var totalHours = (decimal)duration.TotalHours;
                        var totalDays = (decimal)duration.TotalDays;
                        booking.RentalAmount = totalDays >= 1
                            ? Math.Ceiling(totalDays) * booking.DailyRate
                            : Math.Ceiling(totalHours) * booking.HourlyRate;
                        booking.RentalAmount = Math.Round(booking.RentalAmount, 2);
                    }
                booking.LateFee = 0m;
                if (actualReturn > expectedReturn.AddMinutes(graceMinutes))
                {
                    var delayMinutes = (actualReturn - expectedReturn).TotalMinutes;
                    var hoursLate = Convert.ToDecimal(delayMinutes / 60.0);
                    booking.LateFee = Math.Round(hoursLate * booking.HourlyRate, 2);
                }
                if (actualReturn <= expectedReturn)
                {
                    booking.LateFee = 0;
                    booking.ExtraAmount = 0;
                    booking.RefundAmount = booking.DepositAmount;
                    booking.FinalPaymentAmount = -booking.DepositAmount;
                    booking.DepositRefunded = true;

                    // Cập nhật tổng tiền (totalAmount giống booking mẫu bạn đưa)
                    booking.TotalAmount = booking.RentalAmount + booking.DamageFee + booking.LateFee;

                    // Trả về ngay vì không cần xử lý thêm
                    booking.BookingStatus = BookingStatus.CheckedOutPendingPayment;
                    booking.UpdatedAt = DateTime.Now;

                    await _stationRepository.UpdateAvailableSlotsAsync(booking.StationId, +1);
                    var updatedEarlyBooking = await _bookingRepository.UpdateAsync(booking);
                    var dto = _mapper.Map<BookingDto>(updatedEarlyBooking);

                    return ResponseDto<BookingDto>.Success(dto, "Early return: Deposit refunded.");
                }


                // 6️⃣ Compute total = rental + deposit + late + damage
                var totalAmount = booking.RentalAmount + booking.DepositAmount + booking.LateFee + booking.DamageFee;
                booking.TotalAmount = Math.Round(totalAmount, 2);

               
                // 7️⃣ Determine extra or refund
                decimal alreadyPaid = booking.DepositAmount + booking.RentalAmount; // deposit + rental already paid
                var difference = totalAmount - alreadyPaid;

               
                booking.ExtraAmount = difference > 0 ? Math.Round(difference, 2) : 0m;
                booking.RefundAmount = difference < 0 ? Math.Round(-difference, 2) : 0m;
                booking.DepositRefunded = booking.RefundAmount > 0m;
                booking.FinalPaymentAmount = Math.Round(difference, 2);

                
                // 8️⃣ Update status
                booking.BookingStatus = BookingStatus.CheckedOutPendingPayment;
                booking.UpdatedAt = DateTime.Now;

                // 9️⃣ Update station slot (+1 available)
                var stationUpdateResult = await _stationRepository.UpdateAvailableSlotsAsync(booking.StationId, +1);
                if (!stationUpdateResult)
                    return ResponseDto<BookingDto>.Failure("Failed to update station slots on checkout.");
                // 🔟 Save changes
                var updatedBooking = await _bookingRepository.UpdateAsync(booking);
                var bookingDto = _mapper.Map<BookingDto>(updatedBooking);

               
                // 🪄 Response message
                string message = bookingDto.FinalPaymentAmount switch
                {
                    > 0 => $"Checkout complete. Extra payment required: XDR{bookingDto.ExtraAmount:N2}. Please call Payment API with PaymentType = Extra.",
                    < 0 => $"Checkout complete. Refund to process: XDR{bookingDto.RefundAmount:N2}. Please call Payment API with PaymentType = Refund.",
                    _ => "Checkout complete. No extra payment or refund required."
                };

                return ResponseDto<BookingDto>.Success(bookingDto, message);
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during checkout: {ex.Message}");
            }
        }
        public async Task<ResponseDto<BookingDto>> ConfirmRefundAsync(Guid bookingId, string staffId)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null || !booking.IsActive)
                    return ResponseDto<BookingDto>.Failure("Booking not found.");

                // ✅ Chỉ xử lý nếu đúng 2 trạng thái này
                if (booking.BookingStatus != BookingStatus.CheckedOutPendingPayment &&
                    booking.BookingStatus != BookingStatus.CancelledPendingRefund)
                {
                    return ResponseDto<BookingDto>.Failure("Booking is not pending refund confirmation.");
                }

                if (booking.RefundAmount <= 0)
                    return ResponseDto<BookingDto>.Failure("No refund is due for this booking.");

                // ✅ Hoàn tiền thành công
                booking.RefundConfirmedAt = DateTime.Now;
                booking.RefundConfirmedBy = staffId;
                booking.UpdatedAt = DateTime.Now;

                // 🔁 Phân biệt 2 case
                if (booking.BookingStatus == BookingStatus.CheckedOutPendingPayment)
                {
                    booking.BookingStatus = BookingStatus.Completed;
                    booking.IsActive = false;
                }
                else if (booking.BookingStatus == BookingStatus.CancelledPendingRefund)
                {
                    booking.BookingStatus = BookingStatus.Cancelled;
                    booking.IsActive = false;
                }

                var updated = await _bookingRepository.UpdateAsync(booking);
                var dto = _mapper.Map<BookingDto>(updated);

                string resultMsg = booking.BookingStatus == BookingStatus.Completed
                    ? $"Refund of {dto.RefundAmount:C} confirmed. Booking completed."
                    : $"Refund of {dto.RefundAmount:C} confirmed. Booking cancelled.";

                return ResponseDto<BookingDto>.Success(dto, resultMsg);
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error confirming refund: {ex.Message}");
            }
        }


        public async Task<ResponseDto<BookingDto>> CancelBookingAsync(Guid bookingId, string userId)
        {
            try
            {
                // 1️⃣ Validate booking
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null || !booking.IsActive)
                    return ResponseDto<BookingDto>.Failure("Booking not found.");

                if (booking.UserId.ToString() != userId)
                    return ResponseDto<BookingDto>.Failure("Unauthorized.");

                if (booking.BookingStatus == BookingStatus.Cancelled ||
                    booking.BookingStatus == BookingStatus.Completed)
                    return ResponseDto<BookingDto>.Failure("Booking cannot be cancelled.");

                var now = DateTime.Now;
                var hoursBeforeStart = (booking.StartTime - now).TotalHours;

                decimal refundAmount;
                string note;

                if (hoursBeforeStart >= 24)
                {
                    // full refund
                    refundAmount = booking.DepositAmount;
                    note = "Full refund (cancelled > 24h before start)";
                    booking.BookingStatus = BookingStatus.CancelledPendingRefund;
                }
                else
                {
                    // no refund
                    refundAmount = 0;
                    note = "No refund (cancelled < 24h before start)";
                    booking.BookingStatus = BookingStatus.Cancelled;
                    booking.IsActive = false;
                }

                booking.RefundAmount = refundAmount;
                booking.CheckOutNotes = note;
                booking.UpdatedAt = now;

                await _bookingRepository.UpdateAsync(booking);

                var dto = _mapper.Map<BookingDto>(booking);
                var message = refundAmount > 0
                    ? $"Booking cancelled, refund pending {refundAmount:C}."
                    : "Booking cancelled, no refund applicable.";

                return ResponseDto<BookingDto>.Success(dto, message);
            }
            catch (Exception ex)
            {
                return ResponseDto<BookingDto>.Failure($"Error during cancel: {ex.Message}");
            }
        }
        public async Task CancelBookingsAsync(IEnumerable<Booking> bookings, string reason)
        {
            var now = DateTime.Now;

            foreach (var booking in bookings)
            {
                // Cập nhật trạng thái booking
                booking.BookingStatus = BookingStatus.Cancelled;
                booking.IsActive = false;
                booking.CheckOutNotes = reason;
                booking.UpdatedAt = now;

                await _bookingRepository.UpdateAsync(booking);

                // Giải phóng xe liên quan
                await _carRepository.UpdateCarStatusAsync(booking.CarId, true);
            }
        }
       public async Task<ResponseDto<BookingDto>> CancelBookingDueToIncidentAsync(Guid bookingId, string reason)
{
    try
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null || !booking.IsActive)
            return ResponseDto<BookingDto>.Failure("Booking not found.");

        // Cập nhật trạng thái hủy do sự cố
        booking.BookingStatus = BookingStatus.CancelledPendingRefund;
        booking.IsActive = false;
        booking.RefundAmount = booking.DepositAmount; // luôn refund full
        booking.CheckOutNotes = reason;
        booking.UpdatedAt = DateTime.Now;

        await _bookingRepository.UpdateAsync(booking);

        // Giải phóng xe
        await _carRepository.UpdateCarStatusAsync(booking.CarId, true);

        var dto = _mapper.Map<BookingDto>(booking);
        return ResponseDto<BookingDto>.Success(dto, $"Booking cancelled due to incident, refund {booking.RefundAmount:C} pending.");
    }
    catch (Exception ex)
    {
        return ResponseDto<BookingDto>.Failure($"Error during cancel: {ex.Message}");
    }
}

        public async Task AutoCancelNoShowBookingsAsync()
        {
            var now = DateTime.Now;

            var pendingBookings = await _bookingRepository.FindAsync(b =>
                b.IsActive &&
                (b.BookingStatus == BookingStatus.Pending || b.BookingStatus == BookingStatus.DepositPaid) &&
                b.StartTime.AddHours(1) < now
            );

            await CancelBookingsAsync(pendingBookings, "No-show: more than 1h after start");
        }

        public async Task AutoExpirePendingBookingsAsync()
        {
            var now = DateTime.Now;

            var expiredBookings = await _bookingRepository.FindAsync(b =>
                b.IsActive &&
                b.BookingStatus == BookingStatus.Pending &&
                b.CreatedAt.AddMinutes(30) < now
            );

            await CancelBookingsAsync(expiredBookings, "Expired: pending more than 30 minutes");
        }
        public async Task<bool> IsCarAvailableDuringPeriodAsync(Guid carId, DateTime startTime, DateTime endTime)
        {
            // Lấy danh sách booking đang hoạt động của xe (không bị hủy hoặc đã hoàn thành)
            var existingBookings = await _bookingRepository.FindAsync(
                b => b.CarId == carId && b.IsActive && b.BookingStatus != BookingStatus.Cancelled && b.BookingStatus != BookingStatus.Completed
            );

            foreach (var b in existingBookings)
            {
                // Nếu chưa có EndTime (chưa hoàn tất) thì vẫn tính để tránh overlap
                var existingStart = b.StartTime;
                var existingEnd = b.EndTime ?? b.StartTime.AddHours(1); // fallback tạm nếu EndTime null

                // Điều kiện overlap:
                // start < existingEnd && end > existingStart
                if (startTime < existingEnd && endTime > existingStart)
                {
                    return false; // có trùng lịch — xe không khả dụng
                }
            }

            return true;
        }
        public async Task<ResponseDto<List<CarDto>>> GetAvailableCarsByStationIdAsync(
    Guid stationId, DateTime startTime, DateTime endTime)
        {
            try
            {
                // 1️⃣ Validate time
                if (endTime <= startTime)
                    return ResponseDto<List<CarDto>>.Failure("End time must be after start time");

                // 2️⃣ Lấy tất cả xe đang hoạt động và thuộc stationId
                var allCars = await _carRepository.FindAsync(c => c.IsActive && c.CurrentStationId == stationId);

                // 3️⃣ Lấy tất cả booking đang active, chưa bị cancel
                var activeBookings = await _bookingRepository.FindAsync(b =>
                    b.IsActive &&
                    (b.BookingStatus == BookingStatus.Pending ||
                     b.BookingStatus == BookingStatus.DepositPaid ||
                     b.BookingStatus == BookingStatus.CheckedIn ||
                     b.BookingStatus == BookingStatus.CheckedOutPendingPayment)
                );

                // 4️⃣ Lọc ra các carId bị trùng thời gian
                var unavailableCarIds = activeBookings
                    .Where(b =>
                        startTime < (b.EndTime ?? b.StartTime.AddHours(1)) &&
                        endTime > b.StartTime)
                    .Select(b => b.CarId)
                    .Distinct()
                    .ToHashSet();

                // 5️⃣ Giữ lại xe không bị overlap
                var availableCars = allCars
                    .Where(c => !unavailableCarIds.Contains(c.CarId))
                    .ToList();

                // 6️⃣ Map sang DTO
                var dto = _mapper.Map<List<CarDto>>(availableCars);
                return ResponseDto<List<CarDto>>.Success(dto, $"{dto.Count} cars available at station {stationId} in this period");
            }
            catch (Exception ex)
            {
                return ResponseDto<List<CarDto>>.Failure($"Error getting available cars by station: {ex.Message}");
            }
        }
        public async Task<ResponseDto<List<CarDto>>> GetAvailableCarsAsync(DateTime startTime, DateTime endTime)
        {
            try
            {
                // 1️⃣ Validate time
                if (endTime <= startTime)
                    return ResponseDto<List<CarDto>>.Failure("End time must be after start time");

                // 2️⃣ Lấy tất cả xe đang hoạt động
                var allCars = await _carRepository.FindAsync(c => c.IsActive);

                // 3️⃣ Lấy tất cả booking đang active, chưa bị cancel
                var activeBookings = await _bookingRepository.FindAsync(b =>
    b.IsActive &&
    (b.BookingStatus == BookingStatus.Pending ||
     b.BookingStatus == BookingStatus.DepositPaid ||
     b.BookingStatus == BookingStatus.CheckedIn ||
     b.BookingStatus == BookingStatus.CheckedOutPendingPayment)
);


                // 4️⃣ Lọc ra các carId bị trùng thời gian
                var unavailableCarIds = activeBookings
                    .Where(b =>
                        startTime < (b.EndTime ?? b.StartTime.AddHours(1)) &&
                        endTime > b.StartTime)
                    .Select(b => b.CarId)
                    .Distinct()
                    .ToHashSet();

                // 5️⃣ Giữ lại xe không bị overlap
                var availableCars = allCars
                    .Where(c => !unavailableCarIds.Contains(c.CarId))
                    .ToList();

                // 6️⃣ Map sang DTO
                var dto = _mapper.Map<List<CarDto>>(availableCars);
                return ResponseDto<List<CarDto>>.Success(dto, $"{dto.Count} cars available in this period");
            }
            catch (Exception ex)
            {
                return ResponseDto<List<CarDto>>.Failure($"Error getting available cars: {ex.Message}");
            }
        }

        #endregion

        #region Booking Management

        public async Task<ResponseDto<PaginationDto<BookingDto>>> GetBookingsAsync(PaginationRequestDto request)
        {
            try
            {
                
                Expression<Func<Booking, bool>> predicate = b => true;

                var (items, total) = await _bookingRepository.GetPagedAsync(
                    request.Page,
                    request.PageSize,
                    predicate,
                    b => b.CreatedAt,
                    true
                );

                var dto = _mapper.Map<List<BookingDto>>(items);
                var pagination = new PaginationDto<BookingDto>(dto, request.Page, request.PageSize, total);
                return ResponseDto<PaginationDto<BookingDto>>.Success(pagination);
            }
            catch (Exception ex)
            {
                return ResponseDto<PaginationDto<BookingDto>>.Failure($"Error getting bookings: {ex.Message}");
            }
        }
        public async Task<ResponseDto<PaginationDto<BookingDto>>> GetActiveBookingsAsync(PaginationRequestDto request)
        {
            try
            {
                Expression<Func<Booking, bool>> predicate = b => b.IsActive;
                
                var (items, total) = await _bookingRepository.GetPagedAsync(
                    request.Page,
                    request.PageSize,
                    predicate,
                    b => b.CreatedAt,
                    true
                );

                var dto = _mapper.Map<List<BookingDto>>(items);
                var pagination = new PaginationDto<BookingDto>(dto, request.Page, request.PageSize, total);
                return ResponseDto<PaginationDto<BookingDto>>.Success(pagination);
            }
            catch (Exception ex)
            {
                return ResponseDto<PaginationDto<BookingDto>>.Failure($"Error getting active bookings: {ex.Message}");
            }
        }

        public async Task<ResponseDto<PaginationDto<BookingDto>>> GetActiveBookingsByStationAsync(Guid stationId, PaginationRequestDto request)
        {
            try
            {
                Expression<Func<Booking, bool>> predicate = b => b.IsActive && b.StationId == stationId;

                var (items, total) = await _bookingRepository.GetPagedAsync(
                    request.Page,
                    request.PageSize,
                    predicate,
                    b => b.CreatedAt,
                    true
                );

                var dto = _mapper.Map<List<BookingDto>>(items);
                var pagination = new PaginationDto<BookingDto>(dto, request.Page, request.PageSize, total);
                return ResponseDto<PaginationDto<BookingDto>>.Success(pagination);
            }
            catch (Exception ex)
            {
                return ResponseDto<PaginationDto<BookingDto>>.Failure($"Error getting active bookings by station: {ex.Message}");
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

                booking.UpdatedAt = DateTime.Now;

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
                    b.StartTime >= DateTime.Now);

                var orderedBookings = upcomingBookings.OrderBy(b => b.StartTime).Take(100).ToList();
                return ResponseDto<List<BookingDto>>.Success(_mapper.Map<List<BookingDto>>(orderedBookings));
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingDto>>.Failure($"Error getting upcoming bookings: {ex.Message}");
            }
        }

        public async Task<ResponseDto<List<BookingHistoryDto>>> GetBookingHistoryByUserIdAsync(string userId)
        {
            try
            {
                var bookings = await _bookingRepository.GetUserBookingsAsync(userId);
                var history = _mapper.Map<List<BookingHistoryDto>>(bookings);

                return ResponseDto<List<BookingHistoryDto>>.Success(history);
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingHistoryDto>>.Failure($"Error getting booking history for user: {ex.Message}");
            }
        }
        public async Task<ResponseDto<List<BookingDto>>> GetBookingsByStationIdAsync(Guid stationId)
        {
            if (stationId == Guid.Empty)
            {
                return ResponseDto<List<BookingDto>>.Failure("StationId is required");
            }

            try
            {
                var bookings = await _bookingRepository.GetBookingsByStationAsync(stationId);
                var dto = _mapper.Map<List<BookingDto>>(bookings);
                return ResponseDto<List<BookingDto>>.Success(dto);
            }
            catch (Exception ex)
            {
                return ResponseDto<List<BookingDto>>.Failure($"Error getting bookings by station: {ex.Message}");
            }
        }


        #endregion
    }
}