using EVStation_basedRendtalSystem.Services.FeedbackAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Data
{
    public class FeedbackDbContext : DbContext
    {
        public FeedbackDbContext(DbContextOptions<FeedbackDbContext> options) : base(options)
        {
        }

        public DbSet<Feedback> Feedbacks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Feedback>(entity =>
            {
                entity.ToTable("Feedbacks");
                
                entity.HasKey(f => f.FeedbackId);

                entity.Property(f => f.UserId)
                    .IsRequired()
                    .HasMaxLength(450);

                entity.Property(f => f.BookingId)
                    .IsRequired();

                entity.Property(f => f.CarId)
                    .IsRequired();

                entity.Property(f => f.Rating)
                    .IsRequired();

                entity.Property(f => f.Comment)
                    .HasMaxLength(1000);

                entity.Property(f => f.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(f => f.IsActive)
                    .HasDefaultValue(true);

                // Create indexes for better query performance
                entity.HasIndex(f => f.UserId)
                    .HasDatabaseName("IX_Feedbacks_UserId");

                entity.HasIndex(f => f.CarId)
                    .HasDatabaseName("IX_Feedbacks_CarId");

                entity.HasIndex(f => f.BookingId)
                    .HasDatabaseName("IX_Feedbacks_BookingId");
            });
        }
    }
}

