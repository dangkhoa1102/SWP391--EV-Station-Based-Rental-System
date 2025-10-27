using HopDong.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HopDong.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<HopDongThueXe> HopDongThueXes { get; set; }
}
