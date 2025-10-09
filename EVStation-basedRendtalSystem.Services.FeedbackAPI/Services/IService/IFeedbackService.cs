using EVStation_basedRendtalSystem.Services.FeedbackAPI.DTOs;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Services.IService
{
    public interface IFeedbackService
    {
        Task<ApiResponseDto> CreateFeedbackAsync(CreateFeedbackRequestDto request);
        Task<ApiResponseDto> GetFeedbackByIdAsync(int feedbackId);
        Task<ApiResponseDto> GetAllFeedbacksAsync();
        Task<ApiResponseDto> GetFeedbacksByUserIdAsync(string userId);
        Task<ApiResponseDto> GetFeedbacksByCarIdAsync(int carId);
        Task<ApiResponseDto> GetFeedbackByBookingIdAsync(int bookingId);
        Task<ApiResponseDto> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto request);
        Task<ApiResponseDto> DeleteFeedbackAsync(int feedbackId);
        Task<ApiResponseDto> GetCarAverageRatingAsync(int carId);
        Task<ApiResponseDto> GetCarFeedbackStatsAsync(int carId);
    }
}

