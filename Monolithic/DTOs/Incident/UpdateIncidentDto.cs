using Monolithic.Models;
using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Incident
{
    public class UpdateIncidentDto
    {
        [Required]
        public IncidentStatus Status { get; set; }

        public string ResolutionNotes { get; set; } // Ghi chú thêm khi giải quyết
    }
}
