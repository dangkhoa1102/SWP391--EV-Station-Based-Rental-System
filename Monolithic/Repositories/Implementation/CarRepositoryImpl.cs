using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class CarRepositoryImpl : GenericRepository<Car>, ICarRepository
    {
        public CarRepositoryImpl(EVStationBasedRentalSystemDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<IEnumerable<Car>> GetAvailableCarsAsync()
        {
            return await _dbContext.Cars.Where(c => c.IsActive && c.IsAvailable)
                .Include(c => c.CurrentStation)
                .AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetCarsByStationAsync(Guid stationId)
        {
            return await _dbContext.Cars.Where(c => c.IsActive && c.CurrentStationId == stationId)
                .Include(c => c.CurrentStation)
                .AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetAvailableCarsByStationAsync(Guid stationId)
        {
            return await _dbContext.Cars.Where(c => c.IsActive && c.IsAvailable && c.CurrentStationId == stationId)
                .Include(c => c.CurrentStation)
                .AsNoTracking().ToListAsync();
        }

        public async Task<Car?> GetCarWithStationAsync(Guid carId)
        {
            return await _dbContext.Cars.Include(c => c.CurrentStation)
                .FirstOrDefaultAsync(c => c.CarId == carId && c.IsActive); // Use CarId
        }

        public async Task<bool> UpdateCarStatusAsync(Guid carId, bool isAvailable)
        {
            var car = await _dbContext.Cars.FirstOrDefaultAsync(c => c.CarId == carId && c.IsActive); // Use CarId
            if (car == null) return false;
            car.IsAvailable = isAvailable;
            car.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCarBatteryLevelAsync(Guid carId, decimal batteryLevel)
        {
            var car = await _dbContext.Cars.FirstOrDefaultAsync(c => c.CarId == carId && c.IsActive); // Use CarId
            if (car == null) return false;
            car.CurrentBatteryLevel = batteryLevel;
            car.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCarLocationAsync(Guid carId, Guid stationId)
        {
            var car = await _dbContext.Cars.FirstOrDefaultAsync(c => c.CarId == carId && c.IsActive); // Use CarId
            if (car == null) return false;
            car.CurrentStationId = stationId;
            car.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}