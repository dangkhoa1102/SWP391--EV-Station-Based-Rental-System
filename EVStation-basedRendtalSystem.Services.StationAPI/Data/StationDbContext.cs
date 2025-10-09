using EVStation_basedRendtalSystem.Services.StationAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Data
{
    public class StationDbContext : DbContext
    {
        public StationDbContext(DbContextOptions<StationDbContext> options) : base(options)
        {
        }

        public DbSet<Station> Stations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Station>(entity =>
            {
                entity.ToTable("Stations");

                entity.HasKey(s => s.StationId);

                entity.Property(s => s.StationName)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(s => s.Address)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(s => s.PhoneNumber)
                    .HasMaxLength(20);

                entity.Property(s => s.Status)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasDefaultValue("Active");

                entity.Property(s => s.Description)
                    .HasMaxLength(1000);

                entity.Property(s => s.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(s => s.IsActive)
                    .HasDefaultValue(true);

                entity.Property(s => s.TotalParkingSlots)
                    .HasDefaultValue(0);

                entity.Property(s => s.AvailableSlots)
                    .HasDefaultValue(0);

                // Create indexes for better query performance
                entity.HasIndex(s => s.Status)
                    .HasDatabaseName("IX_Stations_Status");

                entity.HasIndex(s => s.StationName)
                    .HasDatabaseName("IX_Stations_StationName");
            });
        }
    }
}

