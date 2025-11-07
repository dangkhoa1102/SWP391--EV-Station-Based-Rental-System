using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;
using System.Security.Claims;

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

        #region New Main Booking Flow

        /// <summary>
        /// Bước 1: Đặt xe + thanh toán đặt cọc
        /// </summary>
        [HttpPost("Create-With-Deposit")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CreateBookingWithDeposit([FromQuery] string userId, [FromBody] CreateBookingDto request)
        {
            var result = await _bookingService.CreateBookingAsync(userId, request);
            if (!result.IsSuccess) 
                return BadRequest(result);

            return CreatedAtAction(nameof(GetBooking), new { id = result.Data!.BookingId }, result);
        }

        /// <summary>
        /// Bước 2: Approve hợp đồng
        /// </summary>
      

        /// <summary>
        /// Bước 3: Check-in với ký hợp đồng
        /// </summary>
        [HttpPost("Check-In-With-Contract")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckInWithContract([FromBody] CheckInWithContractDto request)
        {
            // Lấy userId từ JWT token claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(ResponseDto<BookingDto>.Failure("User not authenticated"));
            }

            var result = await _bookingService.CheckInWithContractAsync(request, userIdClaim);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Bước 5: Check-out với thanh toán tiền thuê
        /// </summary>
        [HttpPost("Check-Out-With-Payment")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckOutWithPayment([FromBody] CheckOutWithPaymentDto request)
        {
            var result = await _bookingService.CheckOutBookingAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }
        [HttpGet("available-cars")]
        public async Task<IActionResult> GetAvailableCars([FromQuery] DateTime startTime, [FromQuery] DateTime endTime)
        {
            var result = await _bookingService.GetAvailableCarsAsync(startTime, endTime);
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
        [HttpGet("Get-Active")]
        public async Task<ActionResult<ResponseDto<PaginationDto<BookingDto>>>> GetActiveBookings([FromQuery] PaginationRequestDto request)
        {
            var result = await _bookingService.GetActiveBookingsAsync(request);
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
        /// Get current user's bookings (from JWT token)
        /// </summary>
        [HttpGet("My-Bookings")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetMyBookings()
        {
            // Lấy userId từ JWT token claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(ResponseDto<List<BookingDto>>.Failure("User not authenticated"));
            }
            
            var result = await _bookingService.GetUserBookingsAsync(userIdClaim);
            return Ok(result);
        }
        [HttpPost("Confirm-Refund/{bookingId:guid}")]
        [Authorize(Roles = "Staff")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> ConfirmRefund(Guid bookingId)
        {
            try
            {
                // 🔐 Lấy staffId từ JWT (ClaimTypes.NameIdentifier)
                var staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(staffId))
                    return Unauthorized(ResponseDto<BookingDto>.Failure("Staff not authenticated."));

                // ✅ Gọi service xử lý
                var result = await _bookingService.ConfirmRefundAsync(bookingId, staffId);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<BookingDto>.Failure($"Error confirming refund: {ex.Message}"));
            }
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
        /// Get current user's active booking (from JWT token)
        /// </summary>
        [HttpGet("My-Active-Booking")]
        public async Task<ActionResult<ResponseDto<BookingStatusDto>>> GetMyActiveBooking()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(ResponseDto<BookingStatusDto>.Failure("User not authenticated"));
            }
            
            var result = await _bookingService.GetActiveBookingAsync(userIdClaim);
            if (!result.IsSuccess) 
                return NotFound(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Get current user's booking history (from JWT token)
        /// </summary>
        [HttpGet("My-Booking-History")]
        public async Task<ActionResult<ResponseDto<List<BookingHistoryDto>>>> GetMyBookingHistory()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(ResponseDto<List<BookingHistoryDto>>.Failure("User not authenticated"));
            }
            
            var result = await _bookingService.GetBookingHistoryAsync(userIdClaim);
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


