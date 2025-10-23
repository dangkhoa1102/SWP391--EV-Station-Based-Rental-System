using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.Models;
using Monolithic.Common;

namespace Monolithic.DTOs.Payment
{
    /// <summary>
    /// Payment response DTO
    /// </summary>
    public class PaymentDto
    {
        public Guid PaymentId { get; set; }
        public Guid BookingId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public string? GatewayName { get; set; }
        public string? GatewayTransactionId { get; set; }
        public string? Description { get; set; }
        public string? FailureReason { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ProcessedAt { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ExpiredAt { get; set; }
        public string? RefundTransactionId { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? RefundedAt { get; set; }
        public string? RefundReason { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Create payment request DTO
    /// </summary>
    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Booking ID is required")]
        public Guid BookingId { get; set; }

        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, 999999999.99, ErrorMessage = "Amount must be between 0.01 and 999,999,999.99")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        public PaymentMethod PaymentMethod { get; set; }

        [Required(ErrorMessage = "Payment type is required")]
        public string PaymentType { get; set; } = "Deposit";

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [StringLength(1000, ErrorMessage = "Return URL cannot exceed 1000 characters")]
        public string? ReturnUrl { get; set; }

        [StringLength(1000, ErrorMessage = "Cancel URL cannot exceed 1000 characters")]
        public string? CancelUrl { get; set; }
    }

    /// <summary>
    /// Payment gateway response DTO
    /// </summary>
    public class PaymentGatewayResponseDto
    {
        public bool IsSuccess { get; set; }
        public string? TransactionId { get; set; }
        public string? GatewayTransactionId { get; set; }
        public string? PaymentUrl { get; set; }
        public string? QrCode { get; set; }
        public string? Message { get; set; }
        public string? ErrorCode { get; set; }
        public Dictionary<string, object>? AdditionalData { get; set; }
    }

    /// <summary>
    /// Confirm payment request DTO
    /// </summary>
    public class ConfirmPaymentDto
    {
        [Required(ErrorMessage = "Payment ID is required")]
        public Guid PaymentId { get; set; }

        [Required(ErrorMessage = "Transaction ID is required")]
        public string TransactionId { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Gateway response cannot exceed 1000 characters")]
        public string? GatewayResponse { get; set; }
    }

    /// <summary>
    /// Refund payment request DTO
    /// </summary>
    public class RefundPaymentDto
    {
        [Required(ErrorMessage = "Payment ID is required")]
        public Guid PaymentId { get; set; }

        [Required(ErrorMessage = "Refund amount is required")]
        [Range(0.01, 999999999.99, ErrorMessage = "Refund amount must be between 0.01 and 999,999,999.99")]
        public decimal RefundAmount { get; set; }

        [Required(ErrorMessage = "Refund reason is required")]
        [StringLength(500, ErrorMessage = "Refund reason cannot exceed 500 characters")]
        public string RefundReason { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Refund transaction ID cannot exceed 100 characters")]
        public string? RefundTransactionId { get; set; }
    }

    /// <summary>
    /// Payment search/filter DTO
    /// </summary>
    public class PaymentSearchDto
    {
        public Guid? BookingId { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public PaymentStatus? PaymentStatus { get; set; }
        public string? TransactionId { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? FromDate { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    /// <summary>
    /// Payment statistics DTO
    /// </summary>
    public class PaymentStatisticsDto
    {
        public decimal TotalAmount { get; set; }
        public int TotalTransactions { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public int PendingCount { get; set; }
        public int RefundedCount { get; set; }
        public decimal SuccessAmount { get; set; }
        public decimal RefundedAmount { get; set; }
        public Dictionary<PaymentMethod, int> PaymentMethodCounts { get; set; } = new();
        public Dictionary<PaymentStatus, int> PaymentStatusCounts { get; set; } = new();
    }
}