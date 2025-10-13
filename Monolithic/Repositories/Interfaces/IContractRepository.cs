using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces
{
    public interface IContractRepository : IGenericRepository<Contract>
    {
        Task<Contract?> GetByBookingIdAsync(Guid bookingId);
        Task<IEnumerable<Contract>> GetByRenterIdAsync(Guid renterId);
        Task<Contract> UpsertDraftAsync(Contract contract);        
    }
}
