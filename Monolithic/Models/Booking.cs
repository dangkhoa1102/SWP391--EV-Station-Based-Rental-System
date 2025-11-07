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
        public decimal RentalAmount { get; set; } 

        [StringLength(50)]
        public BookingStatus BookingStatus { get; set; } = BookingStatus.Pending;

      

        [StringLength(100)]
        public string? DepositTransactionId { get; set; } // Transaction ID của thanh toán đặt cọc

        [StringLength(100)]
        public string? RentalTransactionId { get; set; } // Transaction ID của thanh toán tiền thuê

        public bool IsContractApproved { get; set; } = false; // Đã approve hợp đồng chưa

        public DateTime? ContractApprovedAt { get; set; } // Thời gian approve hợp đồng

        public DateTime? CheckInAt { get; set; } // Thời gian check-in

       
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        [StringLength(500)]
        public string? CheckOutNotes { get; set; }

        public DateTime? RefundConfirmedAt { get; set; }
        public string? RefundConfirmedBy { get; set; }

        [StringLength(1000)]
        public string? CheckOutPhotoUrl { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal LateFee { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal DamageFee { get; set; } = 0;
        public decimal RefundAmount { get; set; }
        public decimal ExtraAmount { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal FinalPaymentAmount { get; set; } = 0;

        public bool DepositRefunded { get; set; } = false;
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("CarId")]
        public virtual Car Car { get; set; } = null!;
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        [ForeignKey("StationId")]
        public virtual Station Station { get; set; } = null!;

        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();


    }

    public enum BookingStatus
    {
        Pending,           // Đang chờ thanh toán đặt cọc
        DepositPaid,       // Đã thanh toán đặt cọc, chờ approve hợp đồng
        CheckedInPendingPayment,
        CheckedIn,         // Đã nhận xe, đang sử dụng
        CheckedOutPendingPayment,
        CheckedOut,        // Đã trả xe
        Completed,         // Hoàn thành
        CancelledPendingRefund,
        Cancelled          // Đã hủy
    }
}