using EVStation_basedRentalSystem.Services.Incident.DTOs.Request;
using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;

namespace EvRental.IncidentService.Services
{
    public interface IIncidentService
    {
        Task<Incident> CreateAsync(CreateIncidentDto dto);
        Task<Incident> GetByIdAsync(Guid id);
        Task<List<Incident>> GetByReporterAsync(Guid reporterId);
        Task<List<Incident>> GetByStationAsync(Guid stationId);
        Task<List<Incident>> GetAllAsync(); // admin
        Task<Incident> VerifyAsync(Guid id, Guid staffId, VerifyIncidentDto dto);
        Task<Incident> ResolveAsync(Guid id, Guid staffId, string comment = null);
        Task<Incident> AssignAsync(Guid id, Guid adminId, Guid staffId);
        Task<Incident> DecideAsync(Guid id, Guid adminId, DecisionDto dto);
    }
}