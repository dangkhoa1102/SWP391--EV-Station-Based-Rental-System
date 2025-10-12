using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;

namespace Monolithic.Services.Interfaces
{
    public interface IIncidentService
    {
        Task<IncidentResponse> CreateIncidentAsync(CreateIncidentFormRequest request);
        Task<IncidentListResponse> GetIncidentsAsync(Guid? stationId, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 20);
        Task<IncidentResponse?> GetIncidentByIdAsync(int id, int userId, string userRole);
        Task<IncidentResponse?> UpdateIncidentAsync(int id, UpdateIncidentFormRequest request, int userId, string userRole);
        Task<bool> ResolveIncidentAsync(int id, UpdateIncidentRequest request, int userId);
        Task<bool> DeleteIncidentAsync(int id);
    }
}
