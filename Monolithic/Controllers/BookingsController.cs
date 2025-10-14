using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Tất cả endpoints yêu cầu đăng nhập
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        #region Main Booking Flow

        /// <summary>
        /// Đặt xe (Bước 1) - Hỗ trợ cả đặt trước và đặt trực tiếp (walk-in)
        /// - Đặt trước: PickupDateTime trong tương lai
        /// - Đặt trực tiếp: PickupDateTime = DateTime.UtcNow hoặc trong vòng 30 phút
        /// </summary>
        /// <param name="userId">ID người dùng</param>
        /// <param name="request">Thông tin đặt xe: CarId, PickupStationId, PickupDateTime, ExpectedReturnDateTime</param>
        /// <returns>Thông tin booking đã tạo với trạng thái Pending (chờ thanh toán)</returns>
        [HttpPost("Create")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CreateBooking([FromQuery] string userId, [FromBody] CreateBookingDto request)
        {
            var result = await _bookingService.CreateBookingAsync(userId, request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return CreatedAtAction(nameof(GetBooking), new { id = result.Data!.BookingId }, result);
        }

        /// <summary>
        /// Xác nhận booking sau khi thanh toán (Bước 2)
        /// - Chuyển trạng thái từ Pending -> Confirmed
        /// - Lưu thông tin thanh toán
        /// </summary>
        /// <param name="request">BookingId, PaymentMethod, PaymentTransactionId</param>
        /// <returns>Booking đã confirmed</returns>
        [HttpPost("Confirm")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> ConfirmBooking([FromBody] ConfirmBookingDto request)
        {
            var result = await _bookingService.ConfirmBookingAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Check-in - Nhận xe (Bước 3: Người dùng nhận xe)
        /// - Xác nhận tại quầy/ứng dụng
        /// - Ký hợp đồng điện tử (tạo Contract tự động)
        /// - Xác nhận bàn giao cùng nhân viên
        /// - Chụp ảnh tình trạng xe (tùy chọn)
        /// - Chuyển trạng thái Confirmed -> CheckedIn
        /// </summary>
        /// <param name="request">BookingId, CheckInNotes (ghi chú), CheckInPhotoUrl (URL ảnh)</param>
        /// <returns>Booking đã check-in và Contract đã được tạo</returns>
        [HttpPost("Check-In")]
        [Authorize(Roles = $"{AppRoles.EVRenter},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckIn([FromBody] CheckInDto request)
        {
            var result = await _bookingService.CheckInAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Check-out - Trả xe (Bước 4: Người dùng trả xe)
        /// - Trả xe đúng điểm thuê (hoặc điểm khác nếu được phép)
        /// - Nhân viên kiểm tra tình trạng xe
        /// - Chụp ảnh tình trạng xe khi trả
        /// - Tính phí trễ hạn (nếu có)
        /// - Tính phí hư hỏng (nếu có)
        /// - Chuyển trạng thái CheckedIn -> CheckedOut
        /// </summary>
        /// <param name="request">BookingId, CheckOutNotes, CheckOutPhotoUrl, LateFee, DamageFee</param>
        /// <returns>Booking đã check-out với tổng chi phí phát sinh</returns>
        [HttpPost("Check-Out")]
        [Authorize(Roles = $"{AppRoles.EVRenter},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckOut([FromBody] CheckOutDto request)
        {
            var result = await _bookingService.CheckOutAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Hoàn tất booking (Bước 5: Thanh toán các chi phí phát sinh)
        /// - Thanh toán các chi phí phát sinh (LateFee, DamageFee)
        /// - Chuyển trạng thái CheckedOut -> Completed
        /// - Cập nhật PaymentStatus = "Paid"
        /// </summary>
        /// <param name="bookingId">ID của booking</param>
        /// <returns>Booking đã hoàn tất</returns>
        [HttpPost("Complete-By-{bookingId}")]
        [Authorize(Roles = $"{AppRoles.EVRenter},{AppRoles.StationStaff},{AppRoles.Admin}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CompleteBooking(Guid bookingId)
        {
            var result = await _bookingService.CompleteBookingAsync(bookingId);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        #endregion

        #region Booking Management

        /// <summary>
        /// Get all bookings with pagination
        /// </summary>
        [HttpGet("Get-All")]
        public async Task<ActionResult<ResponseDto<PaginationDto<BookingDto>>>> GetBookings([FromQuery] PaginationRequestDto request)
        {
            var result = await _bookingService.GetBookingsAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Get booking by ID
        /// </summary>
        [HttpGet("Get-By-{id}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> GetBooking(Guid id)
        {
            var result = await _bookingService.GetBookingByIdAsync(id);
            if (!result.IsSuccess) 
                return NotFound(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Get user's bookings
        /// </summary>
        [HttpGet("Get-By-User/{userId}")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetUserBookings(string userId)
        {
            var result = await _bookingService.GetUserBookingsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Update booking details
        /// </summary>
        [HttpPut("Update-By-{id}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> UpdateBooking(Guid id, [FromBody] UpdateBookingDto request)
        {
            var result = await _bookingService.UpdateBookingAsync(id, request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Cancel a booking
        /// </summary>
        [HttpPost("Cancel-By-{id}")]
        public async Task<ActionResult<ResponseDto<string>>> CancelBooking(Guid id, [FromQuery] string userId, [FromBody] string? reason = null)
        {
            var result = await _bookingService.CancelBookingAsync(id, userId, reason);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        #endregion

        #region Utility Endpoints

        /// <summary>
        /// Check car availability for specific dates
        /// </summary>
        [HttpPost("Check-Availability")]
        public async Task<ActionResult<ResponseDto<bool>>> CheckCarAvailability([FromBody] CheckAvailabilityDto request)
        {
            var result = await _bookingService.CheckCarAvailabilityAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Calculate booking cost
        /// </summary>
        [HttpGet("Calculate-Cost")]
        public async Task<ActionResult<ResponseDto<decimal>>> CalculateCost([FromQuery] Guid carId, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime)
        {
            var result = await _bookingService.CalculateBookingCostAsync(carId, startTime, endTime);
            return Ok(result);
        }

        /// <summary>
        /// Get user's active booking
        /// </summary>
        [HttpGet("Get-Active-By-User/{userId}")]
        public async Task<ActionResult<ResponseDto<BookingStatusDto>>> GetActiveBooking(string userId)
        {
            var result = await _bookingService.GetActiveBookingAsync(userId);
            if (!result.IsSuccess) 
                return NotFound(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Get user's booking history
        /// </summary>
        [HttpGet("Get-History-By-User/{userId}")]
        public async Task<ActionResult<ResponseDto<List<BookingHistoryDto>>>> GetBookingHistory(string userId)
        {
            var result = await _bookingService.GetBookingHistoryAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get upcoming bookings
        /// </summary>
        [HttpGet("Get-Upcoming")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetUpcomingBookings()
        {
            var result = await _bookingService.GetUpcomingBookingsAsync();
            return Ok(result);
        }

        #endregion
    }
}


