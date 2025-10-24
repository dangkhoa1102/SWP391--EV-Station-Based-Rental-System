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

        [StringLength(500)]
        public string? GatewayTransactionId { get; set; } // Gateway's transaction ID

        [StringLength(1000)]
        public string? GatewayResponse { get; set; } // Raw response from gateway

        public DateTime? RefundedAt { get; set; }

        [StringLength(500)]
        public string? RefundReason { get; set; }

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
        CreditCard = 0,
        BankTransfer = 1

    }

    /// <summary>
    /// Payment status enumeration
    /// </summary>
    public enum PaymentStatus
    {
        Pending = 0,        // Chờ xử lý
        Success = 1,        // Thành công
        Failed = 2,         // Thất bại
        Cancelled = 3,      // Đã hủy
        Expired = 4,        // Hết hạn
        Refunded = 5,       // Đã hoàn tiền
    }
}
