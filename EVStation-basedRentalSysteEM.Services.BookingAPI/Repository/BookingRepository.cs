using EVStation_basedRentalSystem.Services.BookingAPI.Data;
using EVStation_basedRentalSystem.Services.BookingAPI.Models;
using EVStation_basedRentalSystem.Services.BookingAPI.Repository.IRepository;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Repository
{
    public class BookingRepository : IBookingRepository
    {
        private readonly BookingDbContext _context;

        public BookingRepository(BookingDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetByIdAsync(int bookingId)
        {
            return await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.IsActive);
        }

        public async Task<List<Booking>> GetAllAsync()
        {
            return await _context.Bookings
                .Where(b => b.IsActive)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetByUserIdAsync(string userId)
        {
            return await _context.Bookings
                .Where(b => b.UserId == userId && b.IsActive)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetByCarIdAsync(int carId)
        {
            return await _context.Bookings
                .Where(b => b.CarId == carId && b.IsActive)
                .OrderByDescending(b => b.PickupDateTime)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetByStatusAsync(string status)
        {
            return await _context.Bookings
                .Where(b => b.BookingStatus == status && b.IsActive)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetActiveBookingsForCarAsync(int carId)
        {
            var activeStatuses = new[] { "Confirmed", "CheckedIn", "InProgress" };
            
            return await _context.Bookings
                .Where(b => b.CarId == carId 
                    && activeStatuses.Contains(b.BookingStatus) 
                    && b.IsActive)
                .ToListAsync();
        }

        public async Task<bool> IsCarAvailableAsync(int carId, DateTime pickupDateTime, DateTime returnDateTime)
        {
            var conflictingBookings = await _context.Bookings
                .Where(b => b.CarId == carId
                    && b.IsActive
                    && b.BookingStatus != "Cancelled"
                    && b.BookingStatus != "Completed"
                    && b.BookingStatus != "Rejected"
                    && (
                        // Overlap scenarios
                        (pickupDateTime >= b.PickupDateTime && pickupDateTime < b.ExpectedReturnDateTime) ||
                        (returnDateTime > b.PickupDateTime && returnDateTime <= b.ExpectedReturnDateTime) ||
                        (pickupDateTime <= b.PickupDateTime && returnDateTime >= b.ExpectedReturnDateTime)
                    ))
                .AnyAsync();

            return !conflictingBookings;
        }

        public async Task<Booking> CreateAsync(Booking booking)
        {
            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task<Booking> UpdateAsync(Booking booking)
        {
            booking.UpdatedAt = DateTime.UtcNow;
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task<bool> DeleteAsync(int bookingId)
        {
            var booking = await GetByIdAsync(bookingId);
            if (booking == null)
                return false;

            booking.IsActive = false;
            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Booking>> GetUpcomingBookingsAsync(DateTime fromDate)
        {
            return await _context.Bookings
                .Where(b => b.PickupDateTime >= fromDate 
                    && b.IsActive
                    && (b.BookingStatus == "Confirmed" || b.BookingStatus == "Pending"))
                .OrderBy(b => b.PickupDateTime)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetBookingHistoryAsync(string userId)
        {
            return await _context.Bookings
                .Where(b => b.UserId == userId 
                    && b.IsActive
                    && (b.BookingStatus == "Completed" || b.BookingStatus == "Cancelled"))
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }
    }
}

