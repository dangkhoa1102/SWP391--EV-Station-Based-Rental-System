using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface IFeedbackRepository : IGenericRepository<Feedback>
    {
        Task<IEnumerable<Feedback>> GetFeedbacksByCarAsync(Guid carId);
        Task<IEnumerable<Feedback>> GetFeedbacksByUserAsync(string userId);
        Task<double> GetAverageRatingForCarAsync(Guid carId);
        Task<int> GetFeedbackCountForCarAsync(Guid carId);
    }
}