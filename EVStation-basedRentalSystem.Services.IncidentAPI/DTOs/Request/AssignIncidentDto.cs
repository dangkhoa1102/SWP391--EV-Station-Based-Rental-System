using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.Incident.DTOs.Request
{
    public class AssignIncidentDto
    {
        [Required]
        public Guid StaffId { get; set; }
    }

    public class DecisionDto
    {
        [Required, MaxLength(2000)]
        public string Decision { get; set; }

        // Optionally mark severity/resulting actions
        public bool AddToRiskList { get; set; } = false;
    }
}
