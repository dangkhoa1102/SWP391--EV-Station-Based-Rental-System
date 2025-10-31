using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Car
    {
        [Key]
        public Guid CarId { get; set; }

        [Required]
        [StringLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        public int Year { get; set; }

        [Required]
        [StringLength(30)]
        public string Color { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal BatteryCapacity { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal CurrentBatteryLevel { get; set; } = 100;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal RentalPricePerHour { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal RentalPricePerDay { get; set; }

        [Required]
        public bool IsAvailable { get; set; } = true;

        [Required]
        public Guid CurrentStationId { get; set; }

        public bool IsActive { get; set; } = true;
        public string ImageUrl { get; set; } = string.Empty;    
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("CurrentStationId")]
        public virtual Station CurrentStation { get; set; } = null!;
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    }
}