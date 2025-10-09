using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface ICarRepository : IGenericRepository<Car>
    {
        Task<IEnumerable<Car>> GetAvailableCarsAsync();
        Task<IEnumerable<Car>> GetCarsByStationAsync(Guid stationId);
        Task<IEnumerable<Car>> GetAvailableCarsByStationAsync(Guid stationId);
        Task<Car?> GetCarWithStationAsync(Guid carId);
        Task<bool> UpdateCarStatusAsync(Guid carId, bool isAvailable);
        Task<bool> UpdateCarBatteryLevelAsync(Guid carId, decimal batteryLevel);
        Task<bool> UpdateCarLocationAsync(Guid carId, Guid stationId);
    }

    public interface IStationRepository : IGenericRepository<Station>
    {
        Task<IEnumerable<Station>> GetNearbyStationsAsync(decimal latitude, decimal longitude, double radiusKm);
        Task<Station?> GetStationWithCarsAsync(Guid stationId);
        Task<bool> UpdateAvailableSlotsAsync(Guid stationId, int change);
    }

    public interface IBookingRepository : IGenericRepository<Booking>
    {
        Task<IEnumerable<Booking>> GetUserBookingsAsync(string userId);
        Task<Booking?> GetActiveBookingByUserAsync(string userId);
        Task<Booking?> GetBookingWithDetailsAsync(Guid bookingId);
        Task<IEnumerable<Booking>> GetBookingsByCarAsync(Guid carId);
        Task<IEnumerable<Booking>> GetBookingsByStationAsync(Guid stationId);
        Task<bool> HasActiveBookingForCarAsync(Guid carId);
    }

    public interface IFeedbackRepository : IGenericRepository<Feedback>
    {
        Task<IEnumerable<Feedback>> GetFeedbacksByCarAsync(Guid carId);
        Task<IEnumerable<Feedback>> GetFeedbacksByUserAsync(string userId);
        Task<double> GetAverageRatingForCarAsync(Guid carId);
        Task<int> GetFeedbackCountForCarAsync(Guid carId);
    }
}