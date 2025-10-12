using EVStation_basedRendtalSystem.Services.StationAPI.Data;
using EVStation_basedRendtalSystem.Services.StationAPI.Models;
using EVStation_basedRendtalSystem.Services.StationAPI.Repository.IRepository;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Repository
{
    public class StationRepository : IStationRepository
    {
        private readonly StationDbContext _context;

        public StationRepository(StationDbContext context)
        {
            _context = context;
        }

        public async Task<Station> CreateAsync(Station station)
        {
            await _context.Stations.AddAsync(station);
            await _context.SaveChangesAsync();
            return station;
        }

        public async Task<Station?> GetByIdAsync(int stationId)
        {
            return await _context.Stations
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive);
        }

        public async Task<IEnumerable<Station>> GetAllAsync()
        {
            return await _context.Stations
                .Where(s => s.IsActive)
                .OrderBy(s => s.StationName)
                .ToListAsync();
        }


        public async Task<IEnumerable<Station>> GetByStatusAsync(string status)
        {
            return await _context.Stations
                .Where(s => s.Status.ToLower() == status.ToLower() && s.IsActive)
                .OrderBy(s => s.StationName)
                .ToListAsync();
        }

        public async Task<Station?> GetByNameAsync(string stationName)
        {
            return await _context.Stations
                .FirstOrDefaultAsync(s => s.StationName.ToLower() == stationName.ToLower() && s.IsActive);
        }

        public async Task<Station> UpdateAsync(Station station)
        {
            station.UpdatedAt = DateTime.UtcNow;
            _context.Stations.Update(station);
            await _context.SaveChangesAsync();
            return station;
        }

        public async Task<bool> DeleteAsync(int stationId)
        {
            var station = await _context.Stations.FindAsync(stationId);
            if (station == null)
                return false;

            // Soft delete
            station.IsActive = false;
            station.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int stationId)
        {
            return await _context.Stations
                .AnyAsync(s => s.StationId == stationId && s.IsActive);
        }

        public async Task<int> GetTotalStationsCountAsync()
        {
            return await _context.Stations
                .CountAsync(s => s.IsActive);
        }

        public async Task<int> GetActiveStationsCountAsync()
        {
            return await _context.Stations
                .CountAsync(s => s.Status == "Active" && s.IsActive);
        }

        public async Task<IEnumerable<Station>> GetStationsWithAvailableSlotsAsync()
        {
            return await _context.Stations
                .Where(s => s.AvailableSlots > 0 && s.IsActive && s.Status == "Active")
                .OrderBy(s => s.StationName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Station>> SearchStationsAsync(string searchTerm)
        {
            return await _context.Stations
                .Where(s => (s.StationName.Contains(searchTerm) ||
                            s.Address.Contains(searchTerm)) &&
                            s.IsActive)
                .OrderBy(s => s.StationName)
                .ToListAsync();
        }

        public async Task<bool> UpdateAvailableSlotsAsync(int stationId, int availableSlots)
        {
            var station = await _context.Stations.FindAsync(stationId);
            if (station == null || !station.IsActive)
                return false;

            station.AvailableSlots = availableSlots;
            station.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

