using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Incident;
using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Yêu cầu xác thực cho tất cả các endpoint trong controller này
public class IncidentsController : ControllerBase
{
    //private readonly IIncidentService _incidentService;
    //private readonly IWebHostEnvironment _environment;

    //public IncidentsController(IIncidentService incidentService, IWebHostEnvironment environment)
    //{
    //    _incidentService = incidentService;
    //    _environment = environment;
    //}

    ///// <summary>
    ///// Tạo báo cáo sự cố mới (có upload hình ảnh)
    ///// </summary>
    //[HttpPost("Create")]
    //public async Task<ActionResult<IncidentResponse>> CreateIncident([FromForm] CreateIncidentFormRequest request)
    //{
    //    try
    //    {
    //        var incident = await _incidentService.CreateIncidentAsync(request);
    //        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
    //    }
    //    catch (ArgumentException ex)
    //    {
    //        return BadRequest(new { message = ex.Message });
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while creating the incident", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Lấy danh sách sự cố (có bộ lọc và phân trang)
    ///// </summary>
    //[HttpGet("Get-All")]
    //public async Task<ActionResult<IncidentListResponse>> GetIncidents(
    //    [FromQuery] Guid? stationId,
    //    [FromQuery] string? status,
    //    [FromQuery] DateTime? dateFrom,
    //    [FromQuery] DateTime? dateTo,
    //    [FromQuery] int page = 1,
    //    [FromQuery] int pageSize = 20)
    //{
    //    try
    //    {
    //        // In real implementation, get user role from JWT token
    //        var userRole = User.FindFirst("role")?.Value ?? "Staff"; // Temporary for demo

    //        var incidents = await _incidentService.GetIncidentsAsync(stationId, status, dateFrom, dateTo, page, pageSize);
    //        return Ok(incidents);
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while retrieving incidents", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Xem chi tiết sự cố
    ///// </summary>
    //[HttpGet("Get-By-{id}")]
    //public async Task<ActionResult<IncidentResponse>> GetIncident(int id)
    //{
    //    try
    //    {
    //        // In real implementation, get user info from JWT token
    //        var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
    //        var userRole = User.FindFirst("role")?.Value ?? "Renter";

    //        var incident = await _incidentService.GetIncidentByIdAsync(id, userId, userRole);

    //        if (incident == null)
    //        {
    //            return NotFound(new { message = "Incident not found" });
    //        }

    //        return Ok(incident);
    //    }
    //    catch (UnauthorizedAccessException ex)
    //    {
    //        return Forbid(ex.Message);
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while retrieving the incident", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Cập nhật thông tin sự cố
    ///// </summary>
    //[HttpPut("Update-By-{id}")]
    //public async Task<ActionResult<IncidentResponse>> UpdateIncident(
    //    int id,
    //    [FromForm] UpdateIncidentFormRequest request)
    //{
    //    try
    //    {
    //        // In real implementation, get user info from JWT token
    //        var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
    //        var userRole = User.FindFirst("role")?.Value ?? "Staff";

    //        var incident = await _incidentService.UpdateIncidentAsync(id, request, userId, userRole);

    //        if (incident == null)
    //        {
    //            return NotFound(new { message = "Incident not found" });
    //        }

    //        return Ok(incident);
    //    }
    //    catch (UnauthorizedAccessException ex)
    //    {
    //        return Forbid(ex.Message);
    //    }
    //    catch (ArgumentException ex)
    //    {
    //        return BadRequest(new { message = ex.Message });
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while updating the incident", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Đánh dấu sự cố đã được giải quyết
    ///// </summary>
    //[HttpPatch("Resolve-By-{id}")]
    //public async Task<ActionResult> ResolveIncident(int id, [FromBody] UpdateIncidentRequest request)
    //{
    //    try
    //    {
    //        // In real implementation, get user info from JWT token
    //        var userId = int.Parse(User.FindFirst("sub")?.Value ?? "0");

    //        var success = await _incidentService.ResolveIncidentAsync(id, request, userId);

    //        if (!success)
    //        {
    //            return NotFound(new { message = "Incident not found" });
    //        }

    //        return NoContent();
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while resolving the incident", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Xóa báo cáo sự cố
    ///// </summary>
    //[HttpDelete("Delete-By-{id}")]
    //public async Task<ActionResult> DeleteIncident(int id)
    //{
    //    try
    //    {
    //        var success = await _incidentService.DeleteIncidentAsync(id);

    //        if (!success)
    //        {
    //            return NotFound(new { message = "Incident not found" });
    //        }

    //        return NoContent();
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while deleting the incident", error = ex.Message });
    //    }
    //}

    ///// <summary>
    ///// Tải xuống hình ảnh sự cố
    ///// </summary>
    //[HttpGet("Download-Image/{imageName}")]
    //public async Task<IActionResult> DownloadImage(string imageName)
    //{
    //    try
    //    {
    //        var imagePath = Path.Combine(_environment.WebRootPath, "uploads", "incidents", imageName);

    //        if (!System.IO.File.Exists(imagePath))
    //        {
    //            return NotFound(new { message = "Image not found" });
    //        }

    //        var memory = new MemoryStream();
    //        using (var stream = new FileStream(imagePath, FileMode.Open))
    //        {
    //            await stream.CopyToAsync(memory);
    //        }
    //        memory.Position = 0;

    //        var contentType = GetContentType(imagePath);
    //        return File(memory, contentType, Path.GetFileName(imagePath));
    //    }
    //    catch (Exception ex)
    //    {
    //        return StatusCode(500, new { message = "An error occurred while downloading the image", error = ex.Message });
    //    }
    //}

    //private string GetContentType(string path)
    //{
    //    var types = new Dictionary<string, string>
    //        {
    //            { ".png", "image/png" },
    //            { ".jpg", "image/jpeg" },
    //            { ".jpeg", "image/jpeg" },
    //            { ".gif", "image/gif" }
    //        };

    //    var ext = Path.GetExtension(path).ToLowerInvariant();
    //    return types.ContainsKey(ext) ? types[ext] : "application/octet-stream";
    //}

    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    // 1. API Tạo mới sự cố
    [HttpPost]
    [Authorize(Roles = "StationStaff")] // Chỉ định rõ vai trò được phép
    public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentDto createDto)
    {
        try
        {
            var newIncident = await _incidentService.CreateIncidentAsync(createDto, User);
            return CreatedAtAction(nameof(GetIncidentById), new { id = newIncident.Id }, newIncident);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // 2. API Lấy danh sách sự cố
    [HttpGet]
    [Authorize(Roles = "Admin,StationStaff,Renter")]
    public async Task<IActionResult> GetAllIncidents()
    {
        var incidents = await _incidentService.GetAllIncidentsAsync(User); // Truyền User để service xử lý phân quyền
        return Ok(incidents);
    }

    // 3. API Lấy chi tiết một sự cố
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetIncidentById(Guid id)
    {
        var incident = await _incidentService.GetIncidentByIdAsync(id, User);
        if (incident is null)
        {
            return NotFound();
        }
        return Ok(incident);
    }

    // 4. API Cập nhật sự cố
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,STAFF")]
    public async Task<IActionResult> UpdateIncident(Guid id, [FromBody] UpdateIncidentDto updateDto)
    {
        try
        {
            var result = await _incidentService.UpdateIncidentAsync(id, updateDto, User);
            if (!result)
            {
                return NotFound("Không tìm thấy sự cố để cập nhật.");
            }
            return NoContent(); // HTTP 204: thành công, không có nội dung trả về
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message); // HTTP 403
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
