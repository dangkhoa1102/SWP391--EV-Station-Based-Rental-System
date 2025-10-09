using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Models
{
    /// <summary>
    /// Represents a car rental booking in the system
    /// </summary>
    public class Booking
    {
        [Key]
        public int BookingId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty; // From UserAPI

        [Required]
        public int CarId { get; set; } // From CarAPI

        [Required]
        public int PickupStationId { get; set; } // From StationAPI

        [Required]
        public int ReturnStationId { get; set; } // From StationAPI

        // ==================== BOOKING DATES ====================
        [Required]
        public DateTime PickupDateTime { get; set; }

        [Required]
        public DateTime ExpectedReturnDateTime { get; set; }

        public DateTime? ActualReturnDateTime { get; set; }

        // ==================== BOOKING STATUS ====================
        [Required]
        [MaxLength(50)]
        public string BookingStatus { get; set; } = "Pending";
        // Pending -> Confirmed -> CheckedIn -> InProgress -> CheckedOut -> Completed
        // Or: Cancelled, Rejected

        // ==================== CHECK-IN/OUT INFO ====================
        public DateTime? CheckInDateTime { get; set; }
        public DateTime? CheckOutDateTime { get; set; }

        [MaxLength(500)]
        public string? CheckInNotes { get; set; } // Ghi chú khi nhận xe

        [MaxLength(500)]
        public string? CheckOutNotes { get; set; } // Ghi chú khi trả xe

        [MaxLength(500)]
        public string? CheckInPhotoUrl { get; set; } // Ảnh xe khi nhận

        [MaxLength(500)]
        public string? CheckOutPhotoUrl { get; set; } // Ảnh xe khi trả

        // ==================== VEHICLE CONDITION ====================
        // [Range(0, 100)]
        // public decimal? BatteryLevelAtPickup { get; set; } // Pin khi nhận xe

        // [Range(0, 100)]
        // public decimal? BatteryLevelAtReturn { get; set; } // Pin khi trả xe

        // ==================== PRICING ====================
        [Range(0, 100000000)]
        public decimal HourlyRate { get; set; } // Giá thuê theo giờ

        [Range(0, 1000000000)]
        public decimal DailyRate { get; set; } // Giá thuê theo ngày

        [Range(0, 1000000)]
        public decimal DepositAmount { get; set; } // Tiền đặt cọc

        [Range(0, 1000000000)]
        public decimal TotalAmount { get; set; } // Tổng tiền thuê

        [Range(0, 1000000000)]
        public decimal? ActualAmount { get; set; } // Tiền thực tế (có thể có phụ phí)

        [Range(0, 1000000)]
        public decimal? LateFee { get; set; } // Phí trễ hạn

        [Range(0, 1000000)]
        public decimal? DamageFee { get; set; } // Phí hư hỏng

        // ==================== PAYMENT INFO ====================
        [MaxLength(50)]
        public string? PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Refunded, Failed

        [MaxLength(100)]
        public string? PaymentMethod { get; set; } // Cash, CreditCard, MoMo, ZaloPay, etc.

        public int? PaymentId { get; set; } // Reference to PaymentAPI

        // ==================== ADDITIONAL INFO ====================

        [MaxLength(1000)]
        public string? CancellationReason { get; set; } // Lý do hủy

        public DateTime? CancelledAt { get; set; }

        [MaxLength(500)]
        public string? AdminNotes { get; set; } // Ghi chú của admin

        // ==================== TIMESTAMPS ====================
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;
    }
}

