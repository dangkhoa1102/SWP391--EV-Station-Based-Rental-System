using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        #region Main Booking Flow

        /// <summary>
        /// Create a new booking (Step 1)
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CreateBooking([FromQuery] string userId, [FromBody] CreateBookingDto request)
        {
            var result = await _bookingService.CreateBookingAsync(userId, request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return CreatedAtAction(nameof(GetBooking), new { id = result.Data!.BookingId }, result);
        }

        /// <summary>
        /// Confirm booking after payment (Step 2)
        /// </summary>
        [HttpPost("confirm")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> ConfirmBooking([FromBody] ConfirmBookingDto request)
        {
            var result = await _bookingService.ConfirmBookingAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Check-in process (Step 3: User picks up the car)
        /// </summary>
        [HttpPost("check-in")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckIn([FromBody] CheckInDto request)
        {
            var result = await _bookingService.CheckInAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Check-out process (Step 4: User returns the car)
        /// </summary>
        [HttpPost("check-out")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CheckOut([FromBody] CheckOutDto request)
        {
            var result = await _bookingService.CheckOutAsync(request);
            if (!result.IsSuccess) 
                return BadRequest(result);
            
            return Ok(result);
        }

        /// <summary>
        /// Complete booking (Step 5: Final completion)
        /// </summary>
        [HttpPost("{bookingId}/complete")]
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
        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<BookingDto>>>> GetBookings([FromQuery] PaginationRequestDto request)
        {
            var result = await _bookingService.GetBookingsAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Get booking by ID
        /// </summary>
        [HttpGet("{id}")]
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
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetUserBookings(string userId)
        {
            var result = await _bookingService.GetUserBookingsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Update booking details
        /// </summary>
        [HttpPut("{id}")]
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
        [HttpPost("{id}/cancel")]
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
        [HttpPost("check-availability")]
        public async Task<ActionResult<ResponseDto<bool>>> CheckCarAvailability([FromBody] CheckAvailabilityDto request)
        {
            var result = await _bookingService.CheckCarAvailabilityAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Calculate booking cost
        /// </summary>
        [HttpGet("calculate-cost")]
        public async Task<ActionResult<ResponseDto<decimal>>> CalculateCost([FromQuery] Guid carId, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime)
        {
            var result = await _bookingService.CalculateBookingCostAsync(carId, startTime, endTime);
            return Ok(result);
        }

        /// <summary>
        /// Get user's active booking
        /// </summary>
        [HttpGet("active/{userId}")]
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
        [HttpGet("history/{userId}")]
        public async Task<ActionResult<ResponseDto<List<BookingHistoryDto>>>> GetBookingHistory(string userId)
        {
            var result = await _bookingService.GetBookingHistoryAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get upcoming bookings
        /// </summary>
        [HttpGet("upcoming")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetUpcomingBookings()
        {
            var result = await _bookingService.GetUpcomingBookingsAsync();
            return Ok(result);
        }

        #endregion
    }
}


