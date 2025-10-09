using EVStation_basedRendtalSystem.Services.FeedbackAPI.Models;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository.IRepository
{
    public interface IFeedbackRepository
    {
        Task<Feedback> CreateAsync(Feedback feedback);
        Task<Feedback?> GetByIdAsync(int feedbackId);
        Task<IEnumerable<Feedback>> GetAllAsync();
        Task<IEnumerable<Feedback>> GetByUserIdAsync(string userId);
        Task<IEnumerable<Feedback>> GetByCarIdAsync(int carId);
        Task<Feedback?> GetByBookingIdAsync(int bookingId);
        Task<Feedback> UpdateAsync(Feedback feedback);
        Task<bool> DeleteAsync(int feedbackId);
        Task<bool> ExistsAsync(int feedbackId);
        Task<bool> HasUserFeedbackForBookingAsync(string userId, int bookingId);
        Task<double> GetAverageRatingByCarIdAsync(int carId);
        Task<int> GetFeedbackCountByCarIdAsync(int carId);
    }
}

