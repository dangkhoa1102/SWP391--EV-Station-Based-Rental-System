using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface IStationRepository : IGenericRepository<Station>
    {
        Task<Station?> GetStationWithCarsAsync(Guid stationId);
        Task<bool> UpdateAvailableSlotsAsync(Guid stationId, int change);
    }
}