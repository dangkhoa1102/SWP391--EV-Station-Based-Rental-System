using Microsoft.EntityFrameworkCore;
using Monolithic.Models;
using System.Reflection.Emit;

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
        public DbSet<Incident> Incidents { get; set; }
        public DbSet<Contract> Contracts { get; set; }

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
                entity.Property(u => u.UserRole).IsRequired().HasDefaultValue("EV Renter");
                entity.Property(u => u.IsActive).HasDefaultValue(true);
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Contract configuration
            builder.Entity<Contract>(entity =>
            {
                entity.HasKey(c => c.ContractId);
                entity.Property(c => c.ContractId).HasDefaultValueSql("NEWID()");
                entity.Property(c => c.BookingId).IsRequired();
                entity.Property(c => c.RenterId).IsRequired();
                entity.Property(c => c.ContractContent).IsRequired().HasMaxLength(4000);
                entity.Property(c => c.ContractContentHash).IsRequired().HasMaxLength(128);
                entity.Property(c => c.SignatureType).IsRequired().HasMaxLength(50);
                entity.Property(c => c.SignatureValue).HasMaxLength(256);
                entity.Property(c => c.SignerEmail).HasMaxLength(256);
                entity.Property(c => c.ConfirmationTokenHash).HasMaxLength(128);
                entity.Property(c => c.TokenExpiresAt);
                entity.Property(c => c.IsConfirmed).HasDefaultValue(false);
                entity.Property(c => c.ConfirmedAt);
                entity.Property(c => c.ConfirmedFromIp).HasMaxLength(100);
                entity.Property(c => c.ConfirmedUserAgent).HasMaxLength(512);
                entity.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne<Booking>()
                      .WithMany()
                      .HasForeignKey(c => c.BookingId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(c => c.BookingId);
                entity.HasIndex(c => c.RenterId);
            });

            // Configure Station entity
            builder.Entity<Station>(entity =>
            {
                entity.HasKey(s => s.StationId); // Use StationId as primary key
                entity.Property(s => s.StationId).HasDefaultValueSql("NEWID()");
                entity.Property(s => s.Name).IsRequired().HasMaxLength(100);
                entity.Property(s => s.Address).IsRequired().HasMaxLength(255);
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
                entity.Property(b => b.BookingStatus).IsRequired().HasMaxLength(50);
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
                entity.HasOne(b => b.ReturnStation)
                      .WithMany(s => s.DropoffBookings)
                      .HasForeignKey(b => b.ReturnStationId)
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

            // Incident configuration
            //builder.Entity<Incident>(entity =>
            //{
            //    entity.HasKey(e => e.Id);
            //    entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
            //    entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            //    entity.Property(e => e.ResolutionNotes).HasMaxLength(500);

            //    // Relationship with Booking
            //    entity.HasOne(e => e.Booking)
            //          .WithMany()
            //          .HasForeignKey(e => e.BookingId)
            //          .OnDelete(DeleteBehavior.Restrict);

            //    // Indexes for better performance
            //    entity.HasIndex(e => e.BookingId);
            //    entity.HasIndex(e => e.Status);
            //    entity.HasIndex(e => e.StationId);
            //    entity.HasIndex(e => e.ReportedAt);
            //});
            builder.Entity<Incident>(entity =>
            {
                // --- Khóa chính ---
                entity.HasKey(e => e.Id);

                // --- C?u hình thu?c tính ---
                entity.Property(e => e.Description)
                      .IsRequired()
                      .HasMaxLength(1000);

                // C?u hình cho Enum Status, l?u d??i d?ng chu?i trong DB cho d? ??c
                entity.Property(e => e.Status)
                      .IsRequired()
                      .HasConversion<string>()
                      .HasMaxLength(50)
                      .HasDefaultValue(IncidentStatus.Reported);

                // ResolvedAt có th? null vì s? c? có th? ch?a ???c gi?i quy?t
                entity.Property(e => e.ResolvedAt)
                      .IsRequired(false);

                // --- C?u hình giá tr? m?c ??nh & t? ??ng ---
                // ?? DB t? gán ngày gi? t?o (UTC)
                entity.Property(e => e.CreatedAt)
                      .HasDefaultValueSql("GETUTCDATE()");

                // UpdatedAt nên ???c x? lý b?i logic trong DbContext.SaveChangesAsync ?? t? ??ng c?p nh?t
                // N?u b?n mu?n DB x? lý, b?n s? c?n trigger, nên cách dùng DbContext t?t h?n.
                entity.Property(e => e.UpdatedAt)
                      .IsRequired();

                entity.Property(e => e.ReportedAt)
                      .IsRequired();

                // --- C?u hình quan h? ---
                // Quan h? m?t-nhi?u: M?t Booking có th? có nhi?u Incident
                entity.HasOne(i => i.Booking)          // M?t Incident thu?c v? m?t Booking
                      .WithMany()                     // M?t Booking có th? có nhi?u Incident (không c?n ch? rõ navigation property trong Booking)
                      .HasForeignKey(i => i.BookingId)  // Khóa ngo?i là BookingId
                      .OnDelete(DeleteBehavior.Restrict); // Ng?n vi?c xóa Booking n?u v?n còn Incident liên quan
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

            // Add indexes for User table
            builder.Entity<User>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            builder.Entity<User>()
                .HasIndex(u => u.Email);
        }
    }
}