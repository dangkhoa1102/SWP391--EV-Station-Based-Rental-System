using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace EvRental.IncidentService.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<Incident> Incidents { get; set; }
        public DbSet<IncidentLog> IncidentLogs { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> opts) : base(opts)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}