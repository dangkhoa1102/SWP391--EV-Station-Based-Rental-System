using Microsoft.EntityFrameworkCore;
using EVStation_basedRentalSystem.Services.UserAPI.Models;

namespace EVStation_basedRentalSystem.Services.UserAPI.Data
{
    public class UserDbContext : DbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Optional: store enum as string
            modelBuilder.Entity<User>()
                .Property(u => u.Status)
                .HasConversion<string>();
        }
    }
}
