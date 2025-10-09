using EVStation_basedRentalSystem.Services.BookingAPI.DTOs;
using EVStation_basedRentalSystem.Services.BookingAPI.Services.IService;
using Microsoft.AspNetCore.Mvc;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(IBookingService bookingService, ILogger<BookingController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        /// <summary>
        /// STEP 1: Create a new booking (Đặt xe)
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _bookingService.CreateBookingAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// STEP 2: Confirm booking after payment (Xác thực thanh toán)
        /// </summary>
        [HttpPost("{bookingId}/confirm")]
        public async Task<IActionResult> ConfirmBooking(int bookingId)
        {
            var result = await _bookingService.ConfirmBookingAsync(bookingId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// STEP 3: Check-in process (Nhận xe tại quầy/ứng dụng)
        /// </summary>
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _bookingService.CheckInAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// STEP 4: Check-out process (Trả xe)
        /// </summary>
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _bookingService.CheckOutAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// STEP 5: Complete booking after final payment (Hoàn thành & thanh toán các chi phí phát sinh)
        /// </summary>
        [HttpPost("{bookingId}/complete")]
        public async Task<IActionResult> CompleteBooking(int bookingId)
        {
            var result = await _bookingService.CompleteBookingAsync(bookingId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get booking by ID
        /// </summary>
        [HttpGet("{bookingId}")]
        public async Task<IActionResult> GetBookingById(int bookingId)
        {
            var result = await _bookingService.GetBookingByIdAsync(bookingId);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        /// <summary>
        /// Get all bookings (Admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllBookings()
        {
            var result = await _bookingService.GetAllBookingsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get user's bookings
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserBookings(string userId)
        {
            var result = await _bookingService.GetUserBookingsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get bookings by status
        /// </summary>
        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetBookingsByStatus(string status)
        {
            var result = await _bookingService.GetBookingsByStatusAsync(status);
            return Ok(result);
        }

        /// <summary>
        /// Cancel booking (Hủy đặt xe)
        /// </summary>
        [HttpPost("{bookingId}/cancel")]
        public async Task<IActionResult> CancelBooking(int bookingId, [FromBody] string reason)
        {
            var result = await _bookingService.CancelBookingAsync(bookingId, reason);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Update booking details
        /// </summary>
        [HttpPut("{bookingId}")]
        public async Task<IActionResult> UpdateBooking(int bookingId, [FromBody] CreateBookingRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _bookingService.UpdateBookingAsync(bookingId, request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Check car availability for specific dates (Tìm điểm thuê trên bản đồ)
        /// </summary>
        [HttpGet("check-availability")]
        public async Task<IActionResult> CheckCarAvailability(
            [FromQuery] int carId,
            [FromQuery] DateTime pickupDateTime,
            [FromQuery] DateTime returnDateTime)
        {
            var result = await _bookingService.CheckCarAvailabilityAsync(carId, pickupDateTime, returnDateTime);
            return Ok(result);
        }

        /// <summary>
        /// Get booking history (Lịch sử & phản tích chi tiêu)
        /// </summary>
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetBookingHistory(string userId)
        {
            var result = await _bookingService.GetBookingHistoryAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get upcoming bookings
        /// </summary>
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingBookings()
        {
            var result = await _bookingService.GetUpcomingBookingsAsync();
            return Ok(result);
        }
    }
}

