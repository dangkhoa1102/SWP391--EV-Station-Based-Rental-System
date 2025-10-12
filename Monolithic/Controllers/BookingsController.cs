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

        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<BookingDto>>>> GetBookings([FromQuery] PaginationRequestDto request)
        {
            var result = await _bookingService.GetBookingsAsync(request);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> GetBooking(Guid id)
        {
            var result = await _bookingService.GetBookingByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ResponseDto<List<BookingDto>>>> GetUserBookings(string userId)
        {
            var result = await _bookingService.GetUserBookingsAsync(userId);
            return Ok(result);
        }

        [HttpPost("user/{userId}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CreateBooking(string userId, [FromBody] CreateBookingDto request)
        {
            var result = await _bookingService.CreateBookingAsync(userId, request);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> UpdateBooking(Guid id, [FromBody] UpdateBookingDto request)
        {
            var result = await _bookingService.UpdateBookingAsync(id, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/cancel")] 
        public async Task<ActionResult<ResponseDto<string>>> CancelBooking(Guid id, [FromQuery] string userId)
        {
            var result = await _bookingService.CancelBookingAsync(id, userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> StartBooking(Guid id, [FromQuery] string userId)
        {
            var result = await _bookingService.StartBookingAsync(id, userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost("{id}/complete")]
        public async Task<ActionResult<ResponseDto<BookingDto>>> CompleteBooking(Guid id, [FromQuery] string userId, [FromQuery] Guid dropoffStationId)
        {
            var result = await _bookingService.CompleteBookingAsync(id, userId, dropoffStationId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("active/{userId}")]
        public async Task<ActionResult<ResponseDto<BookingStatusDto>>> GetActiveBooking(string userId)
        {
            var result = await _bookingService.GetActiveBookingAsync(userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("cost")]
        public async Task<ActionResult<ResponseDto<decimal>>> CalculateCost([FromQuery] Guid carId, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            var result = await _bookingService.CalculateBookingCostAsync(carId, start, end);
            return Ok(result);
        }
    }
}


