using EVStation_basedRendtalSystem.Services.FeedbackAPI.Data;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Models;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository.IRepository;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly FeedbackDbContext _context;

        public FeedbackRepository(FeedbackDbContext context)
        {
            _context = context;
        }

        public async Task<Feedback> CreateAsync(Feedback feedback)
        {
            await _context.Feedbacks.AddAsync(feedback);
            await _context.SaveChangesAsync();
            return feedback;
        }

        public async Task<Feedback?> GetByIdAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId && f.IsActive);
        }

        public async Task<IEnumerable<Feedback>> GetAllAsync()
        {
            return await _context.Feedbacks
                .Where(f => f.IsActive)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetByUserIdAsync(string userId)
        {
            return await _context.Feedbacks
                .Where(f => f.UserId == userId && f.IsActive)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetByCarIdAsync(int carId)
        {
            return await _context.Feedbacks
                .Where(f => f.CarId == carId && f.IsActive)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<Feedback?> GetByBookingIdAsync(int bookingId)
        {
            return await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.BookingId == bookingId && f.IsActive);
        }

        public async Task<Feedback> UpdateAsync(Feedback feedback)
        {
            feedback.UpdatedAt = DateTime.UtcNow;
            _context.Feedbacks.Update(feedback);
            await _context.SaveChangesAsync();
            return feedback;
        }

        public async Task<bool> DeleteAsync(int feedbackId)
        {
            var feedback = await _context.Feedbacks.FindAsync(feedbackId);
            if (feedback == null)
                return false;

            // Soft delete
            feedback.IsActive = false;
            feedback.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AnyAsync(f => f.FeedbackId == feedbackId && f.IsActive);
        }

        public async Task<bool> HasUserFeedbackForBookingAsync(string userId, int bookingId)
        {
            return await _context.Feedbacks
                .AnyAsync(f => f.UserId == userId && f.BookingId == bookingId && f.IsActive);
        }

        public async Task<double> GetAverageRatingByCarIdAsync(int carId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.CarId == carId && f.IsActive)
                .ToListAsync();

            return feedbacks.Any() ? feedbacks.Average(f => f.Rating) : 0;
        }

        public async Task<int> GetFeedbackCountByCarIdAsync(int carId)
        {
            return await _context.Feedbacks
                .CountAsync(f => f.CarId == carId && f.IsActive);
        }
    }
}

