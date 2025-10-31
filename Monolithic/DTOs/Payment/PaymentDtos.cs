using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.Models;
using Monolithic.Common;

namespace Monolithic.DTOs.Payment
{
    public class PaymentDto
    {
        public Guid PaymentId { get; set; }
        public Guid BookingId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string? CheckoutUrl { get; set; }
        public string? QrCode { get; set; }
        public PaymentType PaymentType { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? RefundedAt { get; set; }
        public string? RefundReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }


    public class CreatePaymentDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public PaymentType PaymentType { get; set; } = PaymentType.Deposit;

        public string? Description { get; set; }
    }


}