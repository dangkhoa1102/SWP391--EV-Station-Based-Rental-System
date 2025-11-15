using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;

namespace Monolithic.Services.Interfaces
{
    public interface IIncidentService
    {
        Task<IncidentResponse> CreateIncidentAsync(CreateIncidentFormRequest request);
        Task<IncidentListResponse> GetIncidentsAsync(Guid? stationId, string? status, DateTime? dateFrom, DateTime? dateTo, int page, int pageSize, Guid userId, string userRole, bool includeDeleted);
        Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid userId, string userRole);
        Task<IncidentResponse?> UpdateIncidentAsync(Guid id, UpdateIncidentFormRequest request, Guid userId, string userRole);
        Task<bool> ResolveIncidentAsync(Guid id, UpdateIncidentRequest request, Guid userId);
        Task<bool> ResolveIncidentQuickAsync(Guid id, Guid userId);
        Task<bool> DeleteIncidentAsync(Guid id, Guid userId);                
        Task<IncidentListResponse> GetRenterIncidentsAsync(string renterId, int page = 1, int pageSize = 20);
        Task<IncidentListResponse> GetIncidentsByBookingAsync(Guid bookingId, int page, int pageSize);
    }
}
