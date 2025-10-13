using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Booking
    {
        [Key]
        public Guid BookingId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid PickupStationId { get; set; }

        public Guid? ReturnStationId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public DateTime? ActualReturnDateTime { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal HourlyRate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyRate { get; set; }
    
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }
        [StringLength(50)]
        public BookingStatus BookingStatus { get; set; } = BookingStatus.Pending;


        [Required]
        [StringLength(50)]
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Refunded

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

        [ForeignKey("ReturnStationId")]
        public virtual Station? ReturnStation { get; set; }

        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    }

    public enum BookingStatus
    {
        Pending,      // Đang chờ thanh toán
        Confirmed,    // Đã thanh toán, chờ nhận xe
        CheckedIn,    // Đã nhận xe, đang sử dụng
        CheckedOut,   // Đã trả xe, chờ thanh toán phụ phí
        Completed,    // Hoàn thành
        Cancelled     // Đã hủy
    }
}