using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.IncidentAPI.Entities
{
    public class Incident
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Foreign keys from other services (store ids)
        public Guid? RentalId { get; set; }
        public Guid? VehicleId { get; set; }

        [Required]
        public Guid ReporterId { get; set; }

        public ReporterRole ReporterRole { get; set; } = ReporterRole.RENTER;

        [Required, MaxLength(2000)]
        public string Description { get; set; }

        // Stored as JSON in DB
        public List<string> Photos { get; set; } = new List<string>();

        public Guid? StationId { get; set; }

        public IncidentStatus Status { get; set; } = IncidentStatus.REPORTED;

        public Severity? Severity { get; set; }

        public Guid? AssignedStaffId { get; set; }

        // Decision text by admin (e.g., "Charge renter 300k" or "Sent to maintenance")
        public string Decision { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<IncidentLog> Logs { get; set; } = new List<IncidentLog>();
    }
}
