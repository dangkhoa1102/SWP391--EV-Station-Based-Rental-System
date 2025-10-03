using EvRental.IncidentService.Services;
//using EVStation_basedRentalSystem.Services.Incident.DTOs.Request;
using EVStation_basedRentalSystem.Services.Incident.DTOs.Response;
using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvRental.IncidentService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentsController : ControllerBase
    {
        //private readonly IIncidentService _svc;
        //public IncidentsController(IIncidentService svc) => _svc = svc;

        //// POST /api/incidents
        //[HttpPost]
        ////[Authorize(Roles = "RENTER")]
        //public async Task<IActionResult> Create([FromBody] CreateIncidentDto dto)
        //{
        //    var inc = await _svc.CreateAsync(dto);
        //    var resp = ToDto(inc);
        //    return CreatedAtAction(nameof(GetById), new { id = inc.Id }, resp);
        //}

        //// GET /api/incidents/my?reporterId={id}
        //[HttpGet("my")]
        //public async Task<IActionResult> GetMy([FromQuery] Guid reporterId)
        //{
        //    var list = await _svc.GetByReporterAsync(reporterId);
        //    return Ok(list.Select(ToDto));
        //}

        //// GET /api/incidents/{id}
        //[HttpGet("{id:guid}")]
        //public async Task<IActionResult> GetById(Guid id)
        //{
        //    var inc = await _svc.GetByIdAsync(id);
        //    if (inc == null) return NotFound();
        //    return Ok(ToDto(inc));
        //}

        //// GET /api/incidents/station/{stationId}
        //[HttpGet("station/{stationId:guid}")]
        //public async Task<IActionResult> GetByStation(Guid stationId)
        //{
        //    var list = await _svc.GetByStationAsync(stationId);
        //    return Ok(list.Select(ToDto));
        //}

        //// GET /api/incidents (admin) supports simple filters via query
        //[HttpGet]
        //public async Task<IActionResult> GetAll([FromQuery] IncidentStatus? status = null, [FromQuery] Guid? stationId = null)
        //{
        //    var list = await _svc.GetAllAsync();
        //    if (status.HasValue) list = list.Where(i => i.Status == status.Value).ToList();
        //    if (stationId.HasValue) list = list.Where(i => i.StationId == stationId.Value).ToList();
        //    return Ok(list.Select(ToDto));
        //}

        //// PUT /api/incidents/{id}/verify
        //[HttpPut("{id:guid}/verify")]
        //public async Task<IActionResult> Verify(Guid id, [FromQuery] Guid staffId, [FromBody] VerifyIncidentDto dto)
        //{
        //    var inc = await _svc.VerifyAsync(id, staffId, dto);
        //    var x = inc.UpdatedAt;
        //    //return Ok(ToDto(inc));
        //    return Ok(x);
        //}

        //// PUT /api/incidents/{id}/resolve
        //[HttpPut("{id:guid}/resolve")]
        //public async Task<IActionResult> Resolve(Guid id, [FromQuery] Guid staffId, [FromBody] string comment = null)
        //{
        //    var inc = await _svc.ResolveAsync(id, staffId, comment);
        //    return Ok(ToDto(inc));
        //}

        //// PUT /api/incidents/{id}/assign
        //[HttpPut("{id:guid}/assign")]
        //public async Task<IActionResult> Assign(Guid id, [FromQuery] Guid adminId, [FromBody] AssignIncidentDto dto)
        //{            
        //    var inc = await _svc.AssignAsync(id, adminId, dto.StaffId);
        //    return Ok(ToDto(inc));
        //}

        //// PUT /api/incidents/{id}/decision
        //[HttpPut("{id:guid}/decision")]
        //public async Task<IActionResult> Decision(Guid id, [FromQuery] Guid adminId, [FromBody] DecisionDto dto)
        //{
        //    var inc = await _svc.DecideAsync(id, adminId, dto);
        //    return Ok(ToDto(inc));
        //}

        //private static IncidentResponseDto ToDto(Incident i) => new IncidentResponseDto
        //{
        //    Id = i.Id,
        //    RentalId = i.RentalId,
        //    VehicleId = i.VehicleId,
        //    ReporterId = i.ReporterId,
        //    ReporterRole = i.ReporterRole,
        //    Description = i.Description,
        //    Photos = i.Photos,
        //    StationId = i.StationId,
        //    Status = i.Status,
        //    Severity = i.Severity,
        //    AssignedStaffId = i.AssignedStaffId,
        //    Decision = i.Decision,
        //    CreatedAt = i.CreatedAt,
        //    UpdatedAt = i.UpdatedAt
        //};
    }
}