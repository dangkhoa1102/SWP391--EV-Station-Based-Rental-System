using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface IIncidentRepository
    {
        Task<Incident> GetByIdAsync(Guid id);
        Task<IEnumerable<Incident>> GetAllAsync(); // Sẽ được lọc ở tầng Service
        Task<Incident> AddAsync(Incident incident);
        void Update(Incident incident); // EF Core tracking, không cần async
        Task<bool> SaveChangesAsync();
    }
}
