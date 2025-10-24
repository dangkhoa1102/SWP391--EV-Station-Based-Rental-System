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
        public Guid StationId { get; set; }

        //[Required]
        //public Guid? PickupStationId { get; set; }

        //public Guid? ReturnStationId { get; set; }

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

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal DepositAmount { get; set; } // Số tiền đặt cọc

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal RentalAmount { get; set; } // Số tiền thuê xe (sau khi trừ đặt cọc)

        [StringLength(50)]
        public BookingStatus BookingStatus { get; set; } = BookingStatus.Pending;

        [Required]
        [StringLength(50)]
        public string PaymentStatus { get; set; } = "Pending"; // Pending, DepositPaid, RentalPaid, Completed, Refunded

        [StringLength(50)]
        public string? PaymentMethod { get; set; } // Phương thức thanh toán đặt cọc

        [StringLength(100)]
        public string? DepositTransactionId { get; set; } // Transaction ID của thanh toán đặt cọc

        [StringLength(100)]
        public string? RentalTransactionId { get; set; } // Transaction ID của thanh toán tiền thuê

        public bool IsContractApproved { get; set; } = false; // Đã approve hợp đồng chưa

        public DateTime? ContractApprovedAt { get; set; } // Thời gian approve hợp đồng

        public DateTime? CheckInAt { get; set; } // Thời gian check-in

        public DateTime? CheckOutAt { get; set; } // Thời gian check-out

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("CarId")]
        public virtual Car Car { get; set; } = null!;
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        [ForeignKey("StationId")]
        public virtual Station Station { get; set; } = null!;
    }

    public enum BookingStatus
    {
        Pending,           // Đang chờ thanh toán đặt cọc
        DepositPaid,       // Đã thanh toán đặt cọc, chờ approve hợp đồng
        ContractApproved,  // Đã approve hợp đồng, chờ check-in
        CheckedIn,         // Đã nhận xe, đang sử dụng
        CheckedOut,        // Đã trả xe, chờ thanh toán tiền thuê
        Completed,         // Hoàn thành
        Cancelled          // Đã hủy
    }
}