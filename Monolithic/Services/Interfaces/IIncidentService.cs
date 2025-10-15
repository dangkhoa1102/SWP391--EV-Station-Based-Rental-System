using Monolithic.DTOs.Incident;
using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;
using System.Security.Claims;

namespace Monolithic.Services.Interfaces
{
    public interface IIncidentService
    {
        //Task<IncidentResponse> CreateIncidentAsync(CreateIncidentFormRequest request);
        //Task<IncidentListResponse> GetIncidentsAsync(Guid? stationId, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 20);
        //Task<IncidentResponse?> GetIncidentByIdAsync(int id, int userId, string userRole);
        //Task<IncidentResponse?> UpdateIncidentAsync(int id, UpdateIncidentFormRequest request, int userId, string userRole);
        //Task<bool> ResolveIncidentAsync(int id, UpdateIncidentRequest request, int userId);
        //Task<bool> DeleteIncidentAsync(int id);

        // ClaimsPrincipal user: để lấy thông tin người dùng đang đăng nhập (role, id)
        Task<IncidentDto> CreateIncidentAsync(CreateIncidentDto createDto, ClaimsPrincipal user);
        Task<IEnumerable<IncidentDto>> GetAllIncidentsAsync(ClaimsPrincipal user);
        Task<IncidentDto> GetIncidentByIdAsync(Guid id, ClaimsPrincipal user);
        Task<bool> UpdateIncidentAsync(Guid id, UpdateIncidentDto updateDto, ClaimsPrincipal user);
    }
}
