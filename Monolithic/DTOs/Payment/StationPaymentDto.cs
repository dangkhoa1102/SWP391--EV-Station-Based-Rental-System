using System.ComponentModel.DataAnnotations;
using Monolithic.Models;

namespace Monolithic.DTOs.Payment
{
    /// <summary>
    /// DTO ?? ghi nh?n thanh toán t?i ?i?m b?i Station Staff
    /// </summary>
    public class RecordStationPaymentDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public PaymentType PaymentType { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        /// <summary>
        /// Ph??ng th?c thanh toán: Cash, Card, etc.
        /// </summary>
        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = "Cash";

        /// <summary>
        /// Mã tham chi?u (n?u thanh toán b?ng th?)
        /// </summary>
        [StringLength(100)]
        public string? ReferenceCode { get; set; }

        /// <summary>
        /// Ghi chú
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO ?? ghi nh?n ??t c?c t?i ?i?m
    /// </summary>
    public class RecordDepositDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = "Cash";

        [StringLength(100)]
        public string? ReferenceCode { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO ?? ghi nh?n hoàn c?c
    /// </summary>
    public class RecordRefundDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal RefundAmount { get; set; }

        /// <summary>
        /// Lý do hoàn c?c (n?u có kh?u tr?)
        /// </summary>
        [StringLength(500)]
        public string? RefundReason { get; set; }

        /// <summary>
        /// Phí h? h?ng (n?u có)
        /// </summary>
        [Range(0, double.MaxValue)]
        public decimal DamageFee { get; set; } = 0;

        /// <summary>
        /// Phí tr? mu?n (n?u có)
        /// </summary>
        [Range(0, double.MaxValue)]
        public decimal LateFee { get; set; } = 0;

        [StringLength(50)]
        public string PaymentMethod { get; set; } = "Cash";

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Response sau khi ghi nh?n thanh toán t?i ?i?m
    /// </summary>
    public class StationPaymentResponseDto
    {
        public Guid PaymentId { get; set; }
        public Guid BookingId { get; set; }
        public PaymentType PaymentType { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public string? ReferenceCode { get; set; }
        public DateTime RecordedAt { get; set; }
        public Guid RecordedByStaffId { get; set; }
        public string? Notes { get; set; }
    }
}
