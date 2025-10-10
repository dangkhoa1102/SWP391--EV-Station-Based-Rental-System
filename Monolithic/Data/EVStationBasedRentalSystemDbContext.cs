using Microsoft.EntityFrameworkCore;
using Monolithic.Models;

namespace Monolithic.Data
{
    public class EVStationBasedRentalSystemDbContext : DbContext
    {
        public EVStationBasedRentalSystemDbContext(DbContextOptions<EVStationBasedRentalSystemDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Car> Cars { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User entity
            builder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId); // Use UserId as primary key
                entity.Property(u => u.UserId).HasDefaultValueSql("NEWID()");
                entity.Property(u => u.UserName).IsRequired().HasMaxLength(256);
                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.LastName).IsRequired().HasMaxLength(50);
                entity.Property(u => u.Email).HasMaxLength(256);
                entity.Property(u => u.UserRole).IsRequired().HasDefaultValue("Customer");
                entity.Property(u => u.IsActive).HasDefaultValue(true);
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Station entity
            builder.Entity<Station>(entity =>
            {
                entity.HasKey(s => s.StationId); // Use StationId as primary key
                entity.Property(s => s.StationId).HasDefaultValueSql("NEWID()");
                entity.Property(s => s.Name).IsRequired().HasMaxLength(100);
                entity.Property(s => s.Address).IsRequired().HasMaxLength(255);
                entity.Property(s => s.Latitude).HasPrecision(10, 8);
                entity.Property(s => s.Longitude).HasPrecision(11, 8);
                entity.Property(s => s.IsActive).HasDefaultValue(true);
                entity.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(s => s.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Car entity
            builder.Entity<Car>(entity =>
            {
                entity.HasKey(c => c.CarId); // Use CarId as primary key
                entity.Property(c => c.CarId).HasDefaultValueSql("NEWID()");
                entity.Property(c => c.Brand).IsRequired().HasMaxLength(50);
                entity.Property(c => c.Model).IsRequired().HasMaxLength(50);
                entity.Property(c => c.Color).IsRequired().HasMaxLength(30);
                entity.Property(c => c.LicensePlate).IsRequired().HasMaxLength(20);
                entity.Property(c => c.BatteryCapacity).HasPrecision(5, 2);
                entity.Property(c => c.CurrentBatteryLevel).HasPrecision(5, 2).HasDefaultValue(100);
                entity.Property(c => c.RentalPricePerHour).HasPrecision(10, 2);
                entity.Property(c => c.IsAvailable).HasDefaultValue(true);
                entity.Property(c => c.IsActive).HasDefaultValue(true);
                entity.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(c => c.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Car-Station relationship
                entity.HasOne(c => c.CurrentStation)
                      .WithMany(s => s.Cars)
                      .HasForeignKey(c => c.CurrentStationId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Booking entity
            builder.Entity<Booking>(entity =>
            {
                entity.HasKey(b => b.BookingId); // Use BookingId as primary key
                entity.Property(b => b.BookingId).HasDefaultValueSql("NEWID()");
                entity.Property(b => b.UserId).IsRequired();
                entity.Property(b => b.TotalAmount).HasPrecision(10, 2);
                entity.Property(b => b.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(b => b.IsActive).HasDefaultValue(true);
                entity.Property(b => b.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(b => b.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Booking-User relationship
                entity.HasOne(b => b.User)
                      .WithMany(u => u.Bookings)
                      .HasForeignKey(b => b.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Booking-Car relationship
                entity.HasOne(b => b.Car)
                      .WithMany(c => c.Bookings)
                      .HasForeignKey(b => b.CarId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Booking-PickupStation relationship
                entity.HasOne(b => b.PickupStation)
                      .WithMany(s => s.PickupBookings)
                      .HasForeignKey(b => b.PickupStationId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Booking-DropoffStation relationship (optional)
                entity.HasOne(b => b.DropoffStation)
                      .WithMany(s => s.DropoffBookings)
                      .HasForeignKey(b => b.DropoffStationId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Feedback entity
            builder.Entity<Feedback>(entity =>
            {
                entity.HasKey(f => f.FeedbackId); // Use FeedbackId as primary key
                entity.Property(f => f.FeedbackId).HasDefaultValueSql("NEWID()");
                entity.Property(f => f.UserId).IsRequired();
                entity.Property(f => f.Rating).IsRequired();
                entity.Property(f => f.Comment).HasMaxLength(1000);
                entity.Property(f => f.IsActive).HasDefaultValue(true);
                entity.Property(f => f.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(f => f.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Feedback-User relationship
                entity.HasOne(f => f.User)
                      .WithMany(u => u.Feedbacks)
                      .HasForeignKey(f => f.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Feedback-Car relationship
                entity.HasOne(f => f.Car)
                      .WithMany(c => c.Feedbacks)
                      .HasForeignKey(f => f.CarId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure indexes for better performance
            builder.Entity<Car>()
                .HasIndex(c => c.LicensePlate)
                .IsUnique();

            builder.Entity<Car>()
                .HasIndex(c => c.CurrentStationId);

            builder.Entity<Booking>()
                .HasIndex(b => b.UserId);

            builder.Entity<Booking>()
                .HasIndex(b => b.CarId);

            builder.Entity<Booking>()
                .HasIndex(b => new { b.StartTime, b.EndTime });

            builder.Entity<Feedback>()
                .HasIndex(f => f.CarId);

            builder.Entity<Station>()
                .HasIndex(s => new { s.Latitude, s.Longitude });

            // Add indexes for User table
            builder.Entity<User>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            builder.Entity<User>()
                .HasIndex(u => u.Email);
        }
    }
}