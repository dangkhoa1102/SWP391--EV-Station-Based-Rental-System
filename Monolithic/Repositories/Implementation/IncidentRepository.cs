using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class IncidentRepository : IIncidentRepository
    {
        private readonly EVStationBasedRentalSystemDbContext _context;

        public IncidentRepository(EVStationBasedRentalSystemDbContext context)
        {
            _context = context;
        }

        public async Task<Incident> AddAsync(Incident incident)
        {
            await _context.Incidents.AddAsync(incident);
            return incident;
        }

        public async Task<IEnumerable<Incident>> GetAllAsync()
        {
            return await _context.Incidents.AsNoTracking().ToListAsync();
        }

        public async Task<Incident> GetByIdAsync(Guid id)
        {
            return await _context.Incidents.FindAsync(id);
        }

        public void Update(Incident incident)
        {
            _context.Incidents.Update(incident);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

