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

        /// <summary>
        /// Lấy danh sách đánh giá (có phân trang)
        /// </summary>
        [HttpGet("Get-All")]
        public async Task<ActionResult<ResponseDto<PaginationDto<FeedbackDto>>>> GetFeedbacks([FromQuery] PaginationRequestDto request)
        {
            var result = await _feedbackService.GetFeedbacksAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Xem chi tiết đánh giá
        /// </summary>
        [HttpGet("Get-By-{id}")]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> GetFeedback(Guid id)
        {
            var result = await _feedbackService.GetFeedbackByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Xem đánh giá của một xe
        /// </summary>
        [HttpGet("Get-By-Car/{carId}")]
        public async Task<ActionResult<ResponseDto<List<FeedbackDto>>>> GetCarFeedbacks(Guid carId)
        {
            var result = await _feedbackService.GetCarFeedbacksAsync(carId);
            return Ok(result);
        }

        /// <summary>
        /// Xem đánh giá của người dùng
        /// </summary>
        [HttpGet("Get-By-User/{userId}")]
        public async Task<ActionResult<ResponseDto<List<FeedbackDto>>>> GetUserFeedbacks(string userId)
        {
            var result = await _feedbackService.GetUserFeedbacksAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Tạo đánh giá mới (yêu cầu đăng nhập)
        /// </summary>
        [HttpPost("Create-By-User/{userId}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> CreateFeedback(string userId, [FromBody] CreateFeedbackDto request)
        {
            var result = await _feedbackService.CreateFeedbackAsync(userId, request);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật đánh giá (yêu cầu đăng nhập)
        /// </summary>
        [HttpPut("Update-By-{id}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<FeedbackDto>>> UpdateFeedback(Guid id, [FromQuery] string userId, [FromBody] UpdateFeedbackDto request)
        {
            var result = await _feedbackService.UpdateFeedbackAsync(id, userId, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Xóa đánh giá (yêu cầu đăng nhập)
        /// </summary>
        [HttpDelete("Delete-By-{id}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<string>>> DeleteFeedback(Guid id, [FromQuery] string userId)
        {
            var result = await _feedbackService.DeleteFeedbackAsync(id, userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Xem thống kê đánh giá của xe
        /// </summary>
        [HttpGet("Get-Summary-By-Car/{carId}")]
        public async Task<ActionResult<ResponseDto<FeedbackSummaryDto>>> GetCarFeedbackSummary(Guid carId)
        {
            var result = await _feedbackService.GetCarFeedbackSummaryAsync(carId);
            return Ok(result);
        }
    }
}

