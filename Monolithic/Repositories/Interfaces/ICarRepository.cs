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
}