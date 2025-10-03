using EvRental.IncidentService.Data;
using EVStation_basedRentalSystem.Services.Incident.DTOs.Request;
using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;
using Microsoft.EntityFrameworkCore;

namespace EvRental.IncidentService.Services
{
    public class IncidentService : IIncidentService
    {
        private readonly ApplicationDbContext _db;
        public IncidentService(ApplicationDbContext db) => _db = db;

        public async Task<Incident> CreateAsync(CreateIncidentDto dto)
        {
            var incident = new Incident
            {
                RentalId = dto.RentalId,
                VehicleId = dto.VehicleId,
                ReporterId = dto.ReporterId,
                ReporterRole = dto.ReporterRole,
                Description = dto.Description,
                Photos = dto.Photos ?? new List<string>(),
                StationId = dto.StationId,
                Severity = dto.Severity,
                Status = IncidentStatus.REPORTED,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            incident.Logs.Add(new IncidentLog
            {
                Action = "CREATED",
                ByUserId = dto.ReporterId,
                Role = dto.ReporterRole,
                Comment = "Incident reported"
            });

            _db.Incidents.Add(incident);
            await _db.SaveChangesAsync();
            return incident;
        }

        public async Task<Incident> GetByIdAsync(Guid id)
        {
            return await _db.Incidents
                .Include(i => i.Logs.OrderBy(l => l.Timestamp))
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<List<Incident>> GetByReporterAsync(Guid reporterId)
        {
            return await _db.Incidents
                .Where(i => i.ReporterId == reporterId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Incident>> GetByStationAsync(Guid stationId)
        {
            return await _db.Incidents
                .Where(i => i.StationId == stationId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Incident>> GetAllAsync()
        {
            return await _db.Incidents
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<Incident> VerifyAsync(Guid id, Guid staffId, VerifyIncidentDto dto)
        {
            var inc = await _db.Incidents.Include(i => i.Logs).FirstOrDefaultAsync(i => i.Id == id);
            if (inc == null) throw new KeyNotFoundException("Incident not found");

            inc.Status = dto.IsValid ? IncidentStatus.VERIFIED : IncidentStatus.INVALID;
            inc.UpdatedAt = DateTime.UtcNow;
            if (dto.Photos?.Any() == true)
            {
                inc.Photos.AddRange(dto.Photos);
            }

            inc.Logs.Add(new IncidentLog
            {
                Action = dto.IsValid ? "VERIFIED" : "INVALID",
                ByUserId = staffId,
                Role = ReporterRole.STAFF,
                Comment = dto.Comment
            });

            await _db.SaveChangesAsync();
            return inc;
        }

        public async Task<Incident> ResolveAsync(Guid id, Guid staffId, string comment = null)
        {
            var inc = await _db.Incidents.Include(i => i.Logs).FirstOrDefaultAsync(i => i.Id == id);
            if (inc == null) throw new KeyNotFoundException("Incident not found");

            inc.Status = IncidentStatus.RESOLVED;
            inc.UpdatedAt = DateTime.UtcNow;
            inc.Logs.Add(new IncidentLog
            {
                Action = "RESOLVED",
                ByUserId = staffId,
                Role = ReporterRole.STAFF,
                Comment = comment
            });

            await _db.SaveChangesAsync();
            return inc;
        }

        public async Task<Incident> AssignAsync(Guid id, Guid adminId, Guid staffId)
        {
            var inc = await _db.Incidents.Include(i => i.Logs).FirstOrDefaultAsync(i => i.Id == id);
            if (inc == null) throw new KeyNotFoundException("Incident not found");

            inc.AssignedStaffId = staffId;
            inc.Status = IncidentStatus.ASSIGNED;
            inc.UpdatedAt = DateTime.UtcNow;
            inc.Logs.Add(new IncidentLog
            {
                Action = "ASSIGNED",
                ByUserId = adminId,
                Role = ReporterRole.STAFF,
                Comment = $"Assigned to staff {staffId}"
            });

            await _db.SaveChangesAsync();
            return inc;
        }

        public async Task<Incident> DecideAsync(Guid id, Guid adminId, DecisionDto dto)
        {
            var inc = await _db.Incidents.Include(i => i.Logs).FirstOrDefaultAsync(i => i.Id == id);
            if (inc == null) throw new KeyNotFoundException("Incident not found");

            inc.Decision = dto.Decision;
            inc.UpdatedAt = DateTime.UtcNow;
            // Optionally close incident after decision
            inc.Status = IncidentStatus.CLOSED;

            inc.Logs.Add(new IncidentLog
            {
                Action = "DECISION",
                ByUserId = adminId,
                Role = ReporterRole.RENTER, // role field used as freeform; can be ADMIN but we have only enum -> use RENTER/STAFF; you may extend
                Comment = dto.Decision
            });

            await _db.SaveChangesAsync();
            return inc;
        }
    }
}