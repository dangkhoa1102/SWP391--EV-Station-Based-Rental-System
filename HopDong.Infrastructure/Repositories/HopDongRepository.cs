using HopDong.Domain.Entities;
using HopDong.Domain.Interfaces;
using HopDong.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HopDong.Infrastructure.Repositories;

public class HopDongRepository : IHopDongRepository
{
    private readonly ApplicationDbContext _context;

    public HopDongRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(HopDongThueXe hopDong)
    {
        await _context.HopDongThueXes.AddAsync(hopDong);
        await _context.SaveChangesAsync();
    }

    // --- BỔ SUNG HÀM CÒN THIẾU ---
    public async Task<HopDongThueXe?> GetByIdAsync(Guid id)
    {
        return await _context.HopDongThueXes.FindAsync(id);
    }
    // --- KẾT THÚC BỔ SUNG ---

    public async Task<HopDongThueXe?> GetByTokenAsync(string token)
    {
        return await _context.HopDongThueXes
            .FirstOrDefaultAsync(h => h.ConfirmationToken == token);
    }

    public async Task UpdateAsync(HopDongThueXe hopDong)
    {
        _context.HopDongThueXes.Update(hopDong);
        await _context.SaveChangesAsync();
    }
}
