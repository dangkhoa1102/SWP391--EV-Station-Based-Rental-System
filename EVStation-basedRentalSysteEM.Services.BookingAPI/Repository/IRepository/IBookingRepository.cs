using EVStation_basedRentalSystem.Services.BookingAPI.Models;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Repository.IRepository
{
    public interface IBookingRepository
    {
        Task<Booking?> GetByIdAsync(int bookingId);
        Task<List<Booking>> GetAllAsync();
        Task<List<Booking>> GetByUserIdAsync(string userId);
        Task<List<Booking>> GetByCarIdAsync(int carId);
        Task<List<Booking>> GetByStatusAsync(string status);
        Task<List<Booking>> GetActiveBookingsForCarAsync(int carId);
        Task<bool> IsCarAvailableAsync(int carId, DateTime pickupDateTime, DateTime returnDateTime);
        Task<Booking> CreateAsync(Booking booking);
        Task<Booking> UpdateAsync(Booking booking);
        Task<bool> DeleteAsync(int bookingId);
        Task<List<Booking>> GetUpcomingBookingsAsync(DateTime fromDate);
        Task<List<Booking>> GetBookingHistoryAsync(string userId);
    }
}

