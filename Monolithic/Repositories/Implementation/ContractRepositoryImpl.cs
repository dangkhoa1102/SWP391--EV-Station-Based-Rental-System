using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class ContractRepositoryImpl : GenericRepository<Contract>, IContractRepository
    {
        public ContractRepositoryImpl(EVStationBasedRentalSystemDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<Contract?> GetByBookingIdAsync(Guid bookingId)
        {
            return await _dbContext.Contracts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.BookingId == bookingId);
        }

        public async Task<IEnumerable<Contract>> GetByRenterIdAsync(Guid renterId)
        {
            return await _dbContext.Contracts
                .AsNoTracking()
                .Where(c => c.RenterId == renterId)
                .ToListAsync();
        }

        public async Task<Contract> UpsertDraftAsync(Contract contract)
        {
            using var tx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var existing = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.BookingId == contract.BookingId && !c.IsConfirmed);
                if (existing != null)
                {
                    existing.ContractContent = contract.ContractContent;
                    existing.ContractContentHash = contract.ContractContentHash;
                    existing.SignerEmail = contract.SignerEmail;
                    existing.UpdatedAt = DateTime.UtcNow;
                    _dbContext.Contracts.Update(existing);
                    await _dbContext.SaveChangesAsync();
                    await tx.CommitAsync();
                    return existing;
                }

                await _dbContext.Contracts.AddAsync(contract);
                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
                return contract;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<Contract?> GetByTokenAsync(string token)
        {
            return await _dbContext.Contracts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.ConfirmationToken == token);
        }

        public async Task<Contract?> GetByConfirmationTokenAsync(string token)
        {
            return await _dbContext.Contracts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.ConfirmationToken == token 
                    && c.TokenExpiry.HasValue 
                    && c.TokenExpiry > DateTime.UtcNow
                    && !c.IsDeleted);
        }
    }
}
