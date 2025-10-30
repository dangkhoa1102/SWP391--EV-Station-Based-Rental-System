using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Incident
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

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

        public Guid? ResolvedBy { get; set; } // UserId of admin/staff who resolved

        public Guid? StationId { get; set; } // For filtering by station

        // Staff who created the incident (station staff)
        public Guid? StaffId { get; set; }
        [ForeignKey("StaffId")]
        public virtual User? Staff { get; set; }
    }
}
