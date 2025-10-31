using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class FeedbackRepositoryImpl : GenericRepository<Feedback>, IFeedbackRepository
    {
        public FeedbackRepositoryImpl(EVStationBasedRentalSystemDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<IEnumerable<Feedback>> GetFeedbacksByCarAsync(Guid carId)
        {
            return await _dbContext.Feedbacks.Where(f => f.IsActive && f.CarId == carId)
                .Include(f => f.User)
                .Include(f => f.Car)
                .Include(f => f.Booking)
                .OrderByDescending(f => f.CreatedAt)
                .AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetFeedbacksByUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return new List<Feedback>();
            
            return await _dbContext.Feedbacks.Where(f => f.IsActive && f.UserId == userGuid)
                .Include(f => f.Car)
                .Include(f => f.Booking)
                .OrderByDescending(f => f.CreatedAt)
                .AsNoTracking().ToListAsync();
        }

        public async Task<Feedback?> GetFeedbackByBookingIdAsync(Guid bookingId)
        {
            return await _dbContext.Feedbacks
                .Where(f => f.IsActive && f.BookingId == bookingId)
                .Include(f => f.User)
                .Include(f => f.Car)
                .Include(f => f.Booking)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<bool> HasUserFeedbackForBookingAsync(string userId, Guid bookingId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return false;
            
            return await _dbContext.Feedbacks
                .AnyAsync(f => f.UserId == userGuid && f.BookingId == bookingId && f.IsActive);
        }

        public async Task<double> GetAverageRatingForCarAsync(Guid carId)
        {
            var query = _dbContext.Feedbacks.Where(f => f.IsActive && f.CarId == carId);
            if (!await query.AnyAsync()) return 0.0;
            return await query.AverageAsync(f => f.Rating);
        }

        public async Task<int> GetFeedbackCountForCarAsync(Guid carId)
        {
            return await _dbContext.Feedbacks.CountAsync(f => f.IsActive && f.CarId == carId);
        }
    }
}