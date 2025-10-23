using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    /// <summary>
    /// Represents a payment transaction in the system
    /// </summary>
    public class Payment
    {
        [Key]
        public Guid PaymentId { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [StringLength(100)]
        public string TransactionId { get; set; } = string.Empty; // External payment gateway transaction ID

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(50)]
        public PaymentMethod PaymentMethod { get; set; }

        [Required]
        [StringLength(50)]
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

        [Required]
        [StringLength(50)]
        public string PaymentType { get; set; } = "Deposit"; // Deposit, Rental, Refund

        [StringLength(50)]
        public string? GatewayName { get; set; } // VNPay, MoMo, ZaloPay, etc.

        [StringLength(500)]
        public string? GatewayTransactionId { get; set; } // Gateway's transaction ID

        [StringLength(1000)]
        public string? GatewayResponse { get; set; } // Raw response from gateway

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(1000)]
        public string? FailureReason { get; set; }

        public DateTime? ProcessedAt { get; set; }

        public DateTime? ExpiredAt { get; set; }

        [StringLength(100)]
        public string? RefundTransactionId { get; set; }

        public DateTime? RefundedAt { get; set; }

        [StringLength(500)]
        public string? RefundReason { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = null!;
    }

    /// <summary>
    /// Payment methods supported by the system
    /// </summary>
    public enum PaymentMethod
    {
        Cash = 0,
        CreditCard = 1,
        VNPay = 2,
        MoMo = 3,
        ZaloPay = 4,
        BankTransfer = 5,
        Wallet = 6
    }

    /// <summary>
    /// Payment status enumeration
    /// </summary>
    public enum PaymentStatus
    {
        Pending = 0,        // Chờ xử lý
        Processing = 1,     // Đang xử lý
        Success = 2,        // Thành công
        Failed = 3,         // Thất bại
        Cancelled = 4,      // Đã hủy
        Expired = 5,        // Hết hạn
        Refunded = 6,       // Đã hoàn tiền
        PartialRefunded = 7 // Hoàn tiền một phần
    }
}
