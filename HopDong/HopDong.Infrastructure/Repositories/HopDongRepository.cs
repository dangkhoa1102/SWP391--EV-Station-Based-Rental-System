using HopDong.Domain.Entities;
using HopDong.Domain.Interfaces;
using HopDong.Infrastructure.Data;

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
}
