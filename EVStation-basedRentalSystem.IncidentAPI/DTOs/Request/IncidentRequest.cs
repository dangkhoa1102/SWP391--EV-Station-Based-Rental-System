using System.ComponentModel.DataAnnotations;

namespace IncidentAPI.DTOs.Request
{
    public class IncidentRequest
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        public List<string>? Images { get; set; }

        [Required]
        public int ReportedBy { get; set; } // UserId
    }
}
