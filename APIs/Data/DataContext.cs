using APIs.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace APIs.Data;

public class DataContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    public DataContext(DbContextOptions<DataContext> options) : base(options)
    {
    }
    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Booking>()
        .Property(b => b.TotalPrice)
        .HasPrecision(18, 2);

        builder.Entity<Car>()
            .Property(c => c.hourly_rate)
            .HasPrecision(18, 2);

        builder.Entity<Car>()
            .Property(c => c.daily_rate)
            .HasPrecision(18, 2);

        builder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);
    }
}
