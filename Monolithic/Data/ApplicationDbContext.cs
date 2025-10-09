using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Monolithic.Models;

namespace Monolithic.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Car> Cars { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Car relationships
            builder.Entity<Car>()
                .HasOne(c => c.CurrentStation)
                .WithMany(s => s.Cars)
                .HasForeignKey(c => c.CurrentStationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Booking relationships
            builder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Booking>()
                .HasOne(b => b.Car)
                .WithMany(c => c.Bookings)
                .HasForeignKey(b => b.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Booking>()
                .HasOne(b => b.PickupStation)
                .WithMany(s => s.PickupBookings)
                .HasForeignKey(b => b.PickupStationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Booking>()
                .HasOne(b => b.DropoffStation)
                .WithMany(s => s.DropoffBookings)
                .HasForeignKey(b => b.DropoffStationId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Feedback relationships
            builder.Entity<Feedback>()
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Feedback>()
                .HasOne(f => f.Car)
                .WithMany(c => c.Feedbacks)
                .HasForeignKey(f => f.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision
            builder.Entity<Car>()
                .Property(c => c.BatteryCapacity)
                .HasPrecision(5, 2);

            builder.Entity<Car>()
                .Property(c => c.CurrentBatteryLevel)
                .HasPrecision(5, 2);

            builder.Entity<Car>()
                .Property(c => c.RentalPricePerHour)
                .HasPrecision(10, 2);

            builder.Entity<Station>()
                .Property(s => s.Latitude)
                .HasPrecision(10, 8);

            builder.Entity<Station>()
                .Property(s => s.Longitude)
                .HasPrecision(11, 8);

            builder.Entity<Booking>()
                .Property(b => b.TotalAmount)
                .HasPrecision(10, 2);
        }
    }
}