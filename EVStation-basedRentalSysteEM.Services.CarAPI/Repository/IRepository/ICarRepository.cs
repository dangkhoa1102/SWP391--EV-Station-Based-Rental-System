using EVStation_basedRentalSystem.Services.CarAPI.Models;

namespace EVStation_basedRentalSystem.Services.CarAPI.Repository.IRepository
{
    public interface ICarRepository
    {
        Task<Car> CreateAsync(Car car);
        Task<Car?> GetByIdAsync(int carId);
        Task<IEnumerable<Car>> GetAllAsync();
        Task<IEnumerable<Car>> GetByStationIdAsync(int stationId);
        Task<IEnumerable<Car>> GetByStatusAsync(string status);
        Task<IEnumerable<Car>> GetAvailableCarsAsync();
        Task<Car?> GetByLicensePlateAsync(string licensePlate);
        Task<Car> UpdateAsync(Car car);
        Task<bool> DeleteAsync(int carId);
        Task<bool> ExistsAsync(int carId);
        Task<int> GetTotalCarsCountAsync();
        Task<int> GetAvailableCarsCountAsync();
        Task<IEnumerable<Car>> SearchCarsAsync(string searchTerm);
        Task<IEnumerable<Car>> GetCarsByBrandAsync(string brand);
        Task<IEnumerable<Car>> GetCarsByPriceRangeAsync(decimal minPrice, decimal maxPrice);
        Task<bool> UpdateBatteryLevelAsync(int carId, decimal batteryLevel);
        Task<bool> UpdateStatusAsync(int carId, string status);
    }
}

