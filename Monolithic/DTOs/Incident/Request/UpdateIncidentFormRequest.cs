using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Incident.Request
{
    public class UpdateIncidentFormRequest
    {
        [MaxLength(50)]
        public string? Status { get; set; } // Pending, InProgress, Resolved

        [MaxLength(500)]
        public string? ResolutionNotes { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? CostIncurred { get; set; }

        public Guid? ResolvedBy { get; set; } // UserId of admin/staff

        // Để xóa ảnh cũ (nếu cần)
        public List<string>? ImagesToRemove { get; set; }

        public List<IFormFile>? NewImages { get; set; }
    }
}
