using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation;

public class ContractRepositoryImpl : IContractRepository
{
    private readonly EVStationBasedRentalSystemDbContext _context;

    public ContractRepositoryImpl(EVStationBasedRentalSystemDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Contract c)
    {
        await _context.Contracts.AddAsync(c);
        await _context.SaveChangesAsync();
    }

    // --- B? SUNG HÀM CÒN THI?U ---
    public async Task<Contract?> GetByIdAsync(Guid id)
    {
        return await _context.Contracts.FindAsync(id);
    }
    // --- K?T THÚC B? SUNG ---

    public async Task<Contract?> GetByTokenAsync(string token)
    {
        return await _context.Contracts
            .FirstOrDefaultAsync(h => h.ConfirmationToken == token);
    }

    public async Task<Contract?> GetByBookingIdAsync(Guid bookingId)
    {
        return await _context.Contracts
            .FirstOrDefaultAsync(c => c.BookingId == bookingId && !c.IsDeleted);
    }

    public async Task UpdateAsync(Contract c)
    {
        _context.Contracts.Update(c);
        await _context.SaveChangesAsync();
    }
}
