using EVStation_basedRendtalSystem.Services.StationAPI.Models;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Repository.IRepository
{
    public interface IStationRepository
    {
        Task<Station> CreateAsync(Station station);
        Task<Station?> GetByIdAsync(int stationId);
        Task<IEnumerable<Station>> GetAllAsync();
        Task<IEnumerable<Station>> GetByStatusAsync(string status);
        Task<Station?> GetByNameAsync(string stationName);
        Task<Station> UpdateAsync(Station station);
        Task<bool> DeleteAsync(int stationId);
        Task<bool> ExistsAsync(int stationId);
        Task<int> GetTotalStationsCountAsync();
        Task<int> GetActiveStationsCountAsync();
        Task<IEnumerable<Station>> GetStationsWithAvailableSlotsAsync();
        Task<IEnumerable<Station>> SearchStationsAsync(string searchTerm);
        Task<bool> UpdateAvailableSlotsAsync(int stationId, int availableSlots);
    }
}

