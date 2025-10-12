using EVStation_basedRentalSystem.Services.CarAPI.Data;
using EVStation_basedRentalSystem.Services.CarAPI.Models;
using EVStation_basedRentalSystem.Services.CarAPI.Repository.IRepository;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.Services.CarAPI.Repository
{
    public class CarRepository : ICarRepository
    {
        private readonly CarDbContext _context;

        public CarRepository(CarDbContext context)
        {
            _context = context;
        }

        public async Task<Car> CreateAsync(Car car)
        {
            await _context.Cars.AddAsync(car);
            await _context.SaveChangesAsync();
            return car;
        }

        public async Task<Car?> GetByIdAsync(int carId)
        {
            return await _context.Cars
                .FirstOrDefaultAsync(c => c.CarId == carId && c.IsActive);
        }

        public async Task<IEnumerable<Car>> GetAllAsync()
        {
            return await _context.Cars
                .Where(c => c.IsActive)
                .OrderBy(c => c.Brand)
                .ThenBy(c => c.Model)
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetByStationIdAsync(int stationId)
        {
            return await _context.Cars
                .Where(c => c.StationId == stationId && c.IsActive)
                .OrderBy(c => c.Brand)
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetByStatusAsync(string status)
        {
            return await _context.Cars
                .Where(c => c.Status.ToLower() == status.ToLower() && c.IsActive)
                .OrderBy(c => c.Brand)
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetAvailableCarsAsync()
        {
            return await _context.Cars
                .Where(c => c.Status.ToLower() == "available" && c.IsActive)
                .OrderBy(c => c.Brand)
                .ToListAsync();
        }

        public async Task<Car?> GetByLicensePlateAsync(string licensePlate)
        {
            return await _context.Cars
                .FirstOrDefaultAsync(c => c.LicensePlate.ToLower() == licensePlate.ToLower() && c.IsActive);
        }

        public async Task<Car> UpdateAsync(Car car)
        {
            car.UpdatedAt = DateTime.UtcNow;
            _context.Cars.Update(car);
            await _context.SaveChangesAsync();
            return car;
        }

        public async Task<bool> DeleteAsync(int carId)
        {
            var car = await _context.Cars.FindAsync(carId);
            if (car == null)
                return false;

            // Soft delete
            car.IsActive = false;
            car.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int carId)
        {
            return await _context.Cars
                .AnyAsync(c => c.CarId == carId && c.IsActive);
        }

        public async Task<int> GetTotalCarsCountAsync()
        {
            return await _context.Cars
                .CountAsync(c => c.IsActive);
        }

        public async Task<int> GetAvailableCarsCountAsync()
        {
            return await _context.Cars
                .CountAsync(c => c.Status.ToLower() == "available" && c.IsActive);
        }

        public async Task<IEnumerable<Car>> SearchCarsAsync(string searchTerm)
        {
            return await _context.Cars
                .Where(c => (c.Brand.Contains(searchTerm) ||
                            c.Model.Contains(searchTerm) ||
                            c.LicensePlate.Contains(searchTerm)) &&
                            c.IsActive)
                .OrderBy(c => c.Brand)
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetCarsByBrandAsync(string brand)
        {
            return await _context.Cars
                .Where(c => c.Brand.ToLower() == brand.ToLower() && c.IsActive)
                .OrderBy(c => c.Model)
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetCarsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            return await _context.Cars
                .Where(c => c.DailyRate >= minPrice && c.DailyRate <= maxPrice && c.IsActive)
                .OrderBy(c => c.DailyRate)
                .ToListAsync();
        }

        public async Task<bool> UpdateBatteryLevelAsync(int carId, decimal batteryLevel)
        {
            var car = await _context.Cars.FindAsync(carId);
            if (car == null || !car.IsActive)
                return false;

            car.CurrentBatteryLevel = batteryLevel;
            car.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateStatusAsync(int carId, string status)
        {
            var car = await _context.Cars.FindAsync(carId);
            if (car == null || !car.IsActive)
                return false;

            car.Status = status;
            car.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

