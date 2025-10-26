using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Payment
    {
        [Key]
        public Guid PaymentId { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [StringLength(255)]
        public string TransactionId { get; set; } = string.Empty;

        public long OrderCode { get; set; } // for PayOS link

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

        [Required]
        public PaymentType PaymentType { get; set; } = PaymentType.Deposit;

        public DateTime? PaidAt { get; set; }
        public DateTime? RefundedAt { get; set; }

        [StringLength(500)]
        public string? RefundReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = null!;
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Success = 1,
        Failed = 2,
        Cancelled = 3,
        Expired = 4,
        Refunded = 5
    }

    public enum PaymentType
    {
        Deposit = 0,
        Rental = 1,
        Extra = 2,
        Refund = 3
    }
}
