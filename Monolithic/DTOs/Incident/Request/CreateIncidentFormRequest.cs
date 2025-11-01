using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Incident.Request
{
    public class CreateIncidentFormRequest
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        public List<IFormFile>? Images { get; set; }
    }
}
