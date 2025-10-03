using IncidentAPI.Entities;
using Microsoft.EntityFrameworkCore;

namespace IncidentAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Incident> Incidents { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Incident configuration
            modelBuilder.Entity<Incident>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ResolutionNotes).HasMaxLength(500);

                // Relationship with Booking
                entity.HasOne(e => e.Booking)
                      .WithMany()
                      .HasForeignKey(e => e.BookingId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Indexes for better performance
                entity.HasIndex(e => e.BookingId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.StationId);
                entity.HasIndex(e => e.ReportedAt);
            });

            // Booking configuration
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
            });
        }
    }
}
