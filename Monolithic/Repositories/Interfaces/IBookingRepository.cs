using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface IBookingRepository : IGenericRepository<Booking>
    {
        Task<IEnumerable<Booking>> GetUserBookingsAsync(string userId);
        Task<Booking?> GetActiveBookingByUserAsync(string userId);
        Task<Booking?> GetBookingWithDetailsAsync(Guid bookingId);
        Task<IEnumerable<Booking>> GetBookingsByCarAsync(Guid carId);
        Task<IEnumerable<Booking>> GetBookingsByStationAsync(Guid stationId);
        Task<bool> HasActiveBookingForCarAsync(Guid carId);

        Task<IEnumerable<Booking>> GetActiveBookingsAsync();
    }
}
