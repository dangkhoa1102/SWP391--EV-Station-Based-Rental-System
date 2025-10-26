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
            var result = await _bookingService.CheckInWithContractAsync(request);
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
            var result = await _bookingService.CheckOutWithPaymentAsync(request);
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


