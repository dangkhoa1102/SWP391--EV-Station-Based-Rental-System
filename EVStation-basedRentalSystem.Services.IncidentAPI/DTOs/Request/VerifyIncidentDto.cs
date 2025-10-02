using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.Incident.DTOs.Request
{
    public class VerifyIncidentDto
    {
        [Required]
        public bool IsValid { get; set; }

        public string Comment { get; set; }

        public List<string> Photos { get; set; } = new List<string>();
    }
}
