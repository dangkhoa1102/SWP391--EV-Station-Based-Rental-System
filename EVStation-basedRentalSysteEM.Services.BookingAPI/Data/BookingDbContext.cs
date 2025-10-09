using EVStation_basedRentalSystem.Services.BookingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Data
{
    public class BookingDbContext : DbContext
    {
        public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options)
        {
        }

        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(e => e.BookingId);

                entity.Property(e => e.HourlyRate).HasColumnType("decimal(18,2)");
                entity.Property(e => e.DailyRate).HasColumnType("decimal(18,2)");
                entity.Property(e => e.DepositAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ActualAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.LateFee).HasColumnType("decimal(18,2)");
                entity.Property(e => e.DamageFee).HasColumnType("decimal(18,2)");

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CarId);
                entity.HasIndex(e => e.BookingStatus);
                entity.HasIndex(e => e.PickupDateTime);
                entity.HasIndex(e => e.CreatedAt);
            });
        }
    }
}

