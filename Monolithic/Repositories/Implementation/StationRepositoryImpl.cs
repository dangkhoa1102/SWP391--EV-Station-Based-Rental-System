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

        public async Task<IEnumerable<Station>> GetNearbyStationsAsync(decimal latitude, decimal longitude, double radiusKm)
        {
            // Haversine formula simplified in SQL-less manner; for real accuracy, use geography types.
            const double earthRadiusKm = 6371.0;
            var lat = (double)latitude * Math.PI / 180.0;
            var lon = (double)longitude * Math.PI / 180.0;

            return await _dbContext.Stations
                .Where(s => s.IsActive)
                .AsNoTracking()
                .ToListAsync()
                .ContinueWith(t => t.Result.Where(s =>
                {
                    var sLat = (double)s.Latitude * Math.PI / 180.0;
                    var sLon = (double)s.Longitude * Math.PI / 180.0;
                    var dLat = sLat - lat;
                    var dLon = sLon - lon;
                    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(lat) * Math.Cos(sLat) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
                    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
                    var distance = earthRadiusKm * c;
                    return distance <= radiusKm;
                }));
        }

        public async Task<Station?> GetStationWithCarsAsync(Guid stationId)
        {
            return await _dbContext.Stations
                .Include(s => s.Cars)
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive); // Use StationId
        }

        public async Task<bool> UpdateAvailableSlotsAsync(Guid stationId, int change)
        {
            var station = await _dbContext.Stations.FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive); // Use StationId
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