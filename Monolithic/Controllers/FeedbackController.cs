using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Feedback;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<FeedbackDto>>>> GetFeedbacks([FromQuery] PaginationRequestDto request)
        {
            var result = await _feedbackService.GetFeedbacksAsync(request);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> GetFeedback(Guid id)
        {
            var result = await _feedbackService.GetFeedbackByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("car/{carId}")]
        public async Task<ActionResult<ResponseDto<List<FeedbackDto>>>> GetCarFeedbacks(Guid carId)
        {
            var result = await _feedbackService.GetCarFeedbacksAsync(carId);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ResponseDto<List<FeedbackDto>>>> GetUserFeedbacks(string userId)
        {
            var result = await _feedbackService.GetUserFeedbacksAsync(userId);
            return Ok(result);
        }

        [HttpPost("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> CreateFeedback(string userId, [FromBody] CreateFeedbackDto request)
        {
            var result = await _feedbackService.CreateFeedbackAsync(userId, request);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> UpdateFeedback(Guid id, [FromQuery] string userId, [FromBody] UpdateFeedbackDto request)
        {
            var result = await _feedbackService.UpdateFeedbackAsync(id, userId, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<string>>> DeleteFeedback(Guid id, [FromQuery] string userId)
        {
            var result = await _feedbackService.DeleteFeedbackAsync(id, userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("car/{carId}/summary")]
        public async Task<ActionResult<ResponseDto<FeedbackSummaryDto>>> GetCarFeedbackSummary(Guid carId)
        {
            var result = await _feedbackService.GetCarFeedbackSummaryAsync(carId);
            return Ok(result);
        }
    }
}


