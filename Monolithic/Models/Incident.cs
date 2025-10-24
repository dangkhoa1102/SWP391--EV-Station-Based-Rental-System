using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Incident
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; }

        public string? Images { get; set; } // JSON string to store image URLs

        [Required]
        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ResolvedAt { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Resolved

        [MaxLength(500)]
        public string? ResolutionNotes { get; set; }

        public decimal? CostIncurred { get; set; }

        public int? ResolvedBy { get; set; } // UserId of admin/staff who resolved

        // Additional fields for better tracking
        public int ReportedBy { get; set; } // UserId who reported the incident

        public Guid? StationId { get; set; } // For filtering by station
    }
}
