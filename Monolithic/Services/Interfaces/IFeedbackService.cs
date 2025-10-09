using Monolithic.DTOs.Feedback;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IFeedbackService
    {
        Task<ResponseDto<PaginationDto<FeedbackDto>>> GetFeedbacksAsync(PaginationRequestDto request);
        Task<ResponseDto<FeedbackDto>> GetFeedbackByIdAsync(Guid id);
        Task<ResponseDto<List<FeedbackDto>>> GetCarFeedbacksAsync(Guid carId);
        Task<ResponseDto<List<FeedbackDto>>> GetUserFeedbacksAsync(string userId);
        Task<ResponseDto<FeedbackDto>> CreateFeedbackAsync(string userId, CreateFeedbackDto request);
        Task<ResponseDto<FeedbackDto>> UpdateFeedbackAsync(Guid id, string userId, UpdateFeedbackDto request);
        Task<ResponseDto<string>> DeleteFeedbackAsync(Guid id, string userId);
        Task<ResponseDto<FeedbackSummaryDto>> GetCarFeedbackSummaryAsync(Guid carId);
    }
}