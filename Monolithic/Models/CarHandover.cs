using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    /// <summary>
    /// Model ?? l?u tr? thông tin bàn giao xe (check-in/check-out)
    /// </summary>
    public class CarHandover
    {
        [Key]
        public Guid HandoverId { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid StaffId { get; set; }

        /// <summary>
        /// Lo?i bàn giao: CheckIn ho?c CheckOut
        /// </summary>
        [Required]
        [StringLength(20)]
        public string HandoverType { get; set; } = string.Empty; // CheckIn, CheckOut

        /// <summary>
        /// URLs c?a các ?nh bàn giao (phân cách b?i ;)
        /// </summary>
        [StringLength(2000)]
        public string? PhotoUrls { get; set; }

        /// <summary>
        /// PublicIds c?a Cloudinary (phân cách b?i ;)
        /// </summary>
        [StringLength(1000)]
        public string? PhotoPublicIds { get; set; }

        /// <summary>
        /// Ghi chú v? tình tr?ng xe
        /// </summary>
        [StringLength(1000)]
        public string? Notes { get; set; }

        /// <summary>
        /// M?c pin t?i th?i ?i?m bàn giao
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal BatteryLevelAtHandover { get; set; }

        /// <summary>
        /// S? km ?ã ch?y (cho check-out)
        /// </summary>
        [Column(TypeName = "decimal(10,2)")]
        public decimal? MileageReading { get; set; }

        public DateTime HandoverDateTime { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = null!;

        [ForeignKey("CarId")]
        public virtual Car Car { get; set; } = null!;

        [ForeignKey("StaffId")]
        public virtual User Staff { get; set; } = null!;
    }
}
