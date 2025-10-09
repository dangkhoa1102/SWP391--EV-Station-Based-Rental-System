using EVStation_basedRentalSystem.Services.CarAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.Services.CarAPI.Data
{
    public class CarDbContext : DbContext
    {
        public CarDbContext(DbContextOptions<CarDbContext> options) : base(options)
        {
        }

        public DbSet<Car> Cars { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Car>(entity =>
            {
                entity.ToTable("Cars");

                entity.HasKey(c => c.CarId);

                entity.Property(c => c.StationId)
                    .IsRequired();

                entity.Property(c => c.LicensePlate)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(c => c.Brand)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(c => c.Model)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(c => c.Color)
                    .HasMaxLength(50);

                entity.Property(c => c.ChargerType)
                    .HasMaxLength(50);

                entity.Property(c => c.Status)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasDefaultValue("Available");

                entity.Property(c => c.ImageUrl)
                    .HasMaxLength(500);

                entity.Property(c => c.Description)
                    .HasMaxLength(1000);

                entity.Property(c => c.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(c => c.IsActive)
                    .HasDefaultValue(true);

                entity.Property(c => c.CurrentBatteryLevel)
                    .HasDefaultValue(100);

                entity.Property(c => c.SeatCapacity)
                    .HasDefaultValue(4);

                // Decimal precision configuration
                entity.Property(c => c.BatteryCapacity)
                    .HasPrecision(18, 2);

                entity.Property(c => c.CurrentBatteryLevel)
                    .HasPrecision(18, 2);

                entity.Property(c => c.HourlyRate)
                    .HasPrecision(18, 2);

                entity.Property(c => c.DailyRate)
                    .HasPrecision(18, 2);

                entity.Property(c => c.DepositAmount)
                    .HasPrecision(18, 2);

                // Create indexes for better query performance
                entity.HasIndex(c => c.StationId)
                    .HasDatabaseName("IX_Cars_StationId");

                entity.HasIndex(c => c.Status)
                    .HasDatabaseName("IX_Cars_Status");

                entity.HasIndex(c => c.LicensePlate)
                    .IsUnique()
                    .HasDatabaseName("IX_Cars_LicensePlate");

                entity.HasIndex(c => c.Brand)
                    .HasDatabaseName("IX_Cars_Brand");
            });
        }
    }
}
