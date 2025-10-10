using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Booking
    {
        [Key]
        public Guid BookingId { get; set; }

        [Required]
        public Guid UserId { get; set; } // Changed from string to Guid

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid PickupStationId { get; set; }

        public Guid? DropoffStationId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending";

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("CarId")]
        public virtual Car Car { get; set; } = null!;

        [ForeignKey("PickupStationId")]
        public virtual Station PickupStation { get; set; } = null!;

        [ForeignKey("DropoffStationId")]
        public virtual Station? DropoffStation { get; set; }

        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    }
}