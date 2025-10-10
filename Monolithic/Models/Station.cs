using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Station
    {
        [Key]
        public Guid StationId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(10,8)")]
        public decimal Latitude { get; set; }

        [Required]
        [Column(TypeName = "decimal(11,8)")]
        public decimal Longitude { get; set; }

        [Required]
        public int TotalSlots { get; set; }

        [Required]
        public int AvailableSlots { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Car> Cars { get; set; } = new List<Car>();
        public virtual ICollection<Booking> PickupBookings { get; set; } = new List<Booking>();
        public virtual ICollection<Booking> DropoffBookings { get; set; } = new List<Booking>();
    }
}