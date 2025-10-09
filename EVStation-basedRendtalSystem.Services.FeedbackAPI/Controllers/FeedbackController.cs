using EVStation_basedRendtalSystem.Services.FeedbackAPI.DTOs;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Services.IService;
using Microsoft.AspNetCore.Mvc;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        /// <summary>
        /// Create a new feedback
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "Invalid request data",
                    Data = ModelState
                });
            }

            var result = await _feedbackService.CreateFeedbackAsync(request);
            
            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get feedback by ID
        /// </summary>
        [HttpGet("{feedbackId}")]
        public async Task<IActionResult> GetFeedbackById(int feedbackId)
        {
            var result = await _feedbackService.GetFeedbackByIdAsync(feedbackId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all feedbacks
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllFeedbacks()
        {
            var result = await _feedbackService.GetAllFeedbacksAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get feedbacks by user ID
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFeedbacksByUserId(string userId)
        {
            var result = await _feedbackService.GetFeedbacksByUserIdAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get feedbacks by car ID
        /// </summary>
        [HttpGet("car/{carId}")]
        public async Task<IActionResult> GetFeedbacksByCarId(int carId)
        {
            var result = await _feedbackService.GetFeedbacksByCarIdAsync(carId);
            return Ok(result);
        }

        /// <summary>
        /// Get feedback by booking ID
        /// </summary>
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetFeedbackByBookingId(int bookingId)
        {
            var result = await _feedbackService.GetFeedbackByBookingIdAsync(bookingId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Update feedback
        /// </summary>
        [HttpPut("{feedbackId}")]
        public async Task<IActionResult> UpdateFeedback(int feedbackId, [FromBody] UpdateFeedbackRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "Invalid request data",
                    Data = ModelState
                });
            }

            var result = await _feedbackService.UpdateFeedbackAsync(feedbackId, request);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Delete feedback (soft delete)
        /// </summary>
        [HttpDelete("{feedbackId}")]
        public async Task<IActionResult> DeleteFeedback(int feedbackId)
        {
            var result = await _feedbackService.DeleteFeedbackAsync(feedbackId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get average rating for a car
        /// </summary>
        [HttpGet("car/{carId}/average-rating")]
        public async Task<IActionResult> GetCarAverageRating(int carId)
        {
            var result = await _feedbackService.GetCarAverageRatingAsync(carId);
            return Ok(result);
        }

        /// <summary>
        /// Get feedback statistics for a car
        /// </summary>
        [HttpGet("car/{carId}/stats")]
        public async Task<IActionResult> GetCarFeedbackStats(int carId)
        {
            var result = await _feedbackService.GetCarFeedbackStatsAsync(carId);
            return Ok(result);
        }
    }
}

