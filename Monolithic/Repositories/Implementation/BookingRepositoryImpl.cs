using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class BookingRepositoryImpl : GenericRepository<Booking>, IBookingRepository
    {
        public BookingRepositoryImpl(EVStationBasedRentalSystemDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<IEnumerable<Booking>> GetUserBookingsAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return new List<Booking>();
            
            return await _dbContext.Bookings.Where(b => b.IsActive && b.UserId == userGuid) // Use Guid for comparison
                .Include(b => b.Car)
                .Include(b => b.PickupStation)
                .Include(b => b.DropoffStation)
                .OrderByDescending(b => b.CreatedAt)
                .AsNoTracking().ToListAsync();
        }

        public async Task<Booking?> GetActiveBookingByUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            
            return await _dbContext.Bookings.Include(b => b.Car)
                .Include(b => b.PickupStation)
                .Include(b => b.DropoffStation)
                .FirstOrDefaultAsync(b => b.IsActive && b.UserId == userGuid && b.Status != "Completed" && b.Status != "Cancelled"); // Use Guid for comparison
        }

        public async Task<Booking?> GetBookingWithDetailsAsync(Guid bookingId)
        {
            return await _dbContext.Bookings.Include(b => b.User)
                .Include(b => b.Car)
                .Include(b => b.PickupStation)
                .Include(b => b.DropoffStation)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.IsActive); // Use BookingId
        }

        public async Task<IEnumerable<Booking>> GetBookingsByCarAsync(Guid carId)
        {
            return await _dbContext.Bookings.Where(b => b.IsActive && b.CarId == carId)
                .AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetBookingsByStationAsync(Guid stationId)
        {
            return await _dbContext.Bookings.Where(b => b.IsActive && (b.PickupStationId == stationId || b.DropoffStationId == stationId))
                .AsNoTracking().ToListAsync();
        }

        public async Task<bool> HasActiveBookingForCarAsync(Guid carId)
        {
            return await _dbContext.Bookings.AnyAsync(b => b.IsActive && b.CarId == carId && b.Status != "Completed" && b.Status != "Cancelled");
        }
    }
}