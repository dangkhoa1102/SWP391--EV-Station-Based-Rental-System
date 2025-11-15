using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers;

[Route("api/[controller]")]
[ApiController]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    /// <summary>
    /// Tạo báo cáo sự cố mới (có upload hình ảnh)
    /// </summary>
    [HttpPost("Create")]
    public async Task<ActionResult<IncidentResponse>> CreateIncident([FromForm] CreateIncidentFormRequest request)
    {
        try
        {
            var incident = await _incidentService.CreateIncidentAsync(request);
            return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách sự cố (có bộ lọc và phân trang)
    /// </summary>
    [HttpGet("Get-All")]
    public async Task<ActionResult<IncidentListResponse>> GetIncidents(
        [FromQuery] Guid? stationId,
        [FromQuery] string? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeDeleted = false)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.TryParse(userIdClaim, out var uid) ? uid : Guid.Empty;
            var userRole = User.FindFirst("role")?.Value ?? "Staff";

            var incidents = await _incidentService.GetIncidentsAsync(stationId, status, dateFrom, dateTo, page, pageSize, userId, userRole, includeDeleted);
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving incidents", error = ex.Message });
        }
    }

    /// <summary>
    /// Xem chi tiết sự cố
    /// </summary>
    [HttpGet("Get-By-{id}")]
    public async Task<ActionResult<IncidentResponse>> GetIncident(Guid id)
    {
        try
        {
            // In real implementation, get user info from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user ID" });
            }
            var userRole = User.FindFirst("role")?.Value ?? "Renter";

            var incident = await _incidentService.GetIncidentByIdAsync(id, userId, userRole);

            if (incident == null)
            {
                return NotFound(new { message = "Incident not found" });
            }

            return Ok(incident);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin sự cố
    /// </summary>
    [HttpPut("Update-By-{id}")]
    public async Task<ActionResult<IncidentResponse>> UpdateIncident(
        Guid id,
        [FromForm] UpdateIncidentFormRequest request)
    {
        try
        {
            // In real implementation, get user info from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user ID" });
            }
            var userRole = User.FindFirst("role")?.Value ?? "Staff";

            var incident = await _incidentService.UpdateIncidentAsync(id, request, userId, userRole);

            if (incident == null)
            {
                return NotFound(new { message = "Incident not found" });
            }

            return Ok(incident);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Đánh dấu sự cố đã được giải quyết
    /// </summary>
    [HttpPatch("Resolve-By-{id}")]
    public async Task<ActionResult> ResolveIncident(Guid id, [FromBody] UpdateIncidentRequest request)
    {
        try
        {
            // In real implementation, get user info from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user ID" });
            }

            var success = await _incidentService.ResolveIncidentAsync(id, request, userId);

            if (!success)
            {
                return NotFound(new { message = "Incident not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while resolving the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Đánh dấu sự cố đã được giải quyết (Phiên bản nhanh - chỉ cần id)
    /// </summary>
    [HttpPatch("Quick-Resolve-By-{id}")]
    public async Task<ActionResult> QuickResolveIncident(Guid id)
    {
        try
        {
            // In real implementation, get user info from JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user ID" });
            }

            var success = await _incidentService.ResolveIncidentQuickAsync(id, userId);

            if (!success)
            {
                return NotFound(new { message = "Incident not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while resolving the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Xóa báo cáo sự cố
    /// </summary>
    [HttpDelete("Delete-By-{id}")]
    public async Task<ActionResult> DeleteIncident(Guid id, Guid userId)
    {
        try
        {
            var success = await _incidentService.DeleteIncidentAsync(id, userId);

            if (!success)
            {
                return NotFound(new { message = "Incident not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the incident", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách sự cố liên quan đến booking của renter
    /// </summary>
    [HttpGet("My-Incidents")]
    [Authorize(Roles = AppRoles.EVRenter)]
    public async Task<ActionResult<IncidentListResponse>> GetMyIncidents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            // Lấy userId từ JWT token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var incidents = await _incidentService.GetRenterIncidentsAsync(userIdClaim, page, pageSize);
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving incidents", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách sự cố theo BookingId
    /// </summary>
    [HttpGet("GetByBooking/{bookingId}")]
    public async Task<ActionResult<IncidentListResponse>> GetIncidentsByBooking(
        Guid bookingId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var incidents = await _incidentService.GetIncidentsByBookingAsync(bookingId, page, pageSize);
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving incidents", error = ex.Message });
        }
    }

    private string GetContentType(string path)
    {
        var types = new Dictionary<string, string>
            {
                { ".png", "image/png" },
                { ".jpg", "image/jpeg" },
                { ".jpeg", "image/jpeg" },
                { ".gif", "image/gif" }
            };

        var ext = Path.GetExtension(path).ToLowerInvariant();
        return types.ContainsKey(ext) ? types[ext] : "application/octet-stream";
    }
}
