using Monolithic.Models;

namespace Monolithic.Repositories.Interfaces;

public interface IContractRepository 
{
    Task AddAsync(Contract c);
    Task<Contract?> GetByIdAsync(Guid id);
    Task<Contract?> GetByTokenAsync(string token); // M?i
    Task UpdateAsync(Contract c); // M?i
}
