using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.IncidentAPI.Entities
{
    public class IncidentLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid IncidentId { get; set; }
        public Incident Incident { get; set; }

        [Required]
        public string Action { get; set; } // e.g., "CREATED", "VERIFIED", "ASSIGNED", "RESOLVED", "DECISION"

        public Guid? ByUserId { get; set; }
        public ReporterRole? Role { get; set; }

        public string Comment { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
