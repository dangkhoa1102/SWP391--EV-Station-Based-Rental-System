using APIs.Data;
using APIs.DTOs.Request;
using APIs.DTOs.Response;
using APIs.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IncidentsController : ControllerBase
    {
        private readonly DataContext _context;

        public IncidentsController(DataContext context)
        {
            _context = context;
        }

        // POST: api/incidents
        [HttpPost]
        [Authorize(Roles = "Renter")]
        public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentRequest request)
        {
            var booking = await _context.Bookings.FindAsync(request.BookingId);
            if (booking == null) return BadRequest("Booking not found");

            var incident = new Incident
            {
                BookingId = request.BookingId,
                Description = request.Description,
                ReportAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Incident reported successfully", incident.Id });
        }

        // GET: api/incidents
        [HttpGet]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<ActionResult<IEnumerable<IncidentResponse>>> GetIncidents()
        {
            var incidents = await _context.Incidents
                .Select(i => new IncidentResponse
                {
                    Id = i.Id,
                    BookingId = i.BookingId,
                    Description = i.Description,
                    ReportAt = i.ReportAt,
                    ResolvedAt = i.ResolvedAt,
                    Status = i.Status
                })
                .ToListAsync();

            return Ok(incidents);
        }

        // PUT: api/incidents/{id}/resolve
        [HttpPut("{id}/resolve")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> ResolveIncident(int id)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return NotFound();

            incident.Status = "Resolved";
            incident.ResolvedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Incident resolved successfully" });
        }
    }
}
