using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Incident.Request
{
    public class IncidentRequest
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        public List<string>? Images { get; set; }

        [Required]
        public int ReportedBy { get; set; } // UserId
    }
}
