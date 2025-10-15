using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Incident
{
    public class CreateIncidentDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public string Description { get; set; }
    }
}
