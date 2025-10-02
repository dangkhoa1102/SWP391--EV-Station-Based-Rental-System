using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;
using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.Incident.DTOs.Request
{
    public class CreateIncidentDto
    {
        public Guid? RentalId { get; set; }
        public Guid? VehicleId { get; set; }

        [Required]
        public Guid ReporterId { get; set; }

        public ReporterRole ReporterRole { get; set; } = ReporterRole.RENTER;

        [Required, MaxLength(2000)]
        public string Description { get; set; }

        // Array of URLs/base64/image ids (depends on your storage)
        public List<string> Photos { get; set; } = new List<string>();

        public Guid? StationId { get; set; }

        public Severity? Severity { get; set; }
    }
}
