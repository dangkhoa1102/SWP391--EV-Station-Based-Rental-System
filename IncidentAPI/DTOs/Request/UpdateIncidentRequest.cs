using System.ComponentModel.DataAnnotations;

namespace IncidentAPI.DTOs.Request
{
    public class UpdateIncidentRequest
    {
        [MaxLength(50)]
        public string? Status { get; set; } // Pending, InProgress, Resolved

        [MaxLength(500)]
        public string? ResolutionNotes { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? CostIncurred { get; set; }

        public int? ResolvedBy { get; set; } // UserId of admin/staff

        // Thêm phần upload ảnh mới
        public List<IFormFile>? NewImages { get; set; }

        // Để xóa ảnh cũ (nếu cần)
        public List<string>? ImagesToRemove { get; set; }
    }
}
