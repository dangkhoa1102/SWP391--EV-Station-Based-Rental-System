using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class StationRepositoryImpl : GenericRepository<Station>, IStationRepository
    {
        public StationRepositoryImpl(EVStationBasedRentalSystemDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<Station?> GetStationWithCarsAsync(Guid stationId)
        {
            return await _dbContext.Stations
                .Include(s => s.Cars)
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive);
        }

        public async Task<bool> UpdateAvailableSlotsAsync(Guid stationId, int change)
        {
            var station = await _dbContext.Stations.FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive);
            if (station == null)
            {
                return false;
            }

            var newSlots = station.AvailableSlots + change;
            if (newSlots < 0 || newSlots > station.TotalSlots)
            {
                return false;
            }

            station.AvailableSlots = newSlots;
            station.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}