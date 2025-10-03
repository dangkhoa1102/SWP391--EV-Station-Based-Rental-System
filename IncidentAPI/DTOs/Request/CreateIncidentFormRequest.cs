using System.ComponentModel.DataAnnotations;

namespace IncidentAPI.DTOs.Request
{
    public class CreateIncidentFormRequest
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        [Required]
        public int ReportedBy { get; set; } // UserId

        public List<IFormFile>? Images { get; set; }
    }
}
