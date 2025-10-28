using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Station;
using Monolithic.Models;
using Monolithic.Common;

namespace Monolithic.DTOs.Booking
{
    public class BookingDto
    {
        public Guid BookingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public Guid StationId { get; set; }
        public string StationName { get; set; } = string.Empty;
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ExpectedReturnDateTime { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ActualReturnDateTime { get; set; }
        public BookingStatus BookingStatus { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal DailyRate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal RentalAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? DepositTransactionId { get; set; }
        public string? RentalTransactionId { get; set; }
        public bool IsContractApproved { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ContractApprovedAt { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? CheckInAt { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? CheckOutAt { get; set; }
        public bool IsActive { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime UpdatedAt { get; set; }

        public decimal LateFee { get; set; } = 0;

        public decimal DamageFee { get; set; } = 0;
        public bool DepositRefunded { get; set; }= false;
    }

    public class CreateBookingDto
    {
        [Required(ErrorMessage = "Car ID is required")]
        public Guid CarId { get; set; }

        [Required(ErrorMessage = "Pickup station is required")]
        public Guid PickupStationId { get; set; }

        public Guid? ReturnStationId { get; set; }

        [Required(ErrorMessage = "Pickup date and time is required")]
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }

        [Required(ErrorMessage = "Expected return date and time is required")]
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ExpectedReturnDateTime { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        public string PaymentMethod { get; set; } = string.Empty;

        [StringLength(100)]
        public string? TransactionId { get; set; } // Transaction ID cho thanh toán đặt cọc
    }

    public class UpdateBookingDto
    {
        public Guid? ReturnStationId { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ExpectedReturnDateTime { get; set; }
        public BookingStatus? BookingStatus { get; set; }
    }

    public class BookingStatusDto
    {
        public Guid BookingId { get; set; }
        public BookingStatus BookingStatus { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ExpectedReturnDateTime { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ActualReturnDateTime { get; set; }
        public decimal TotalAmount { get; set; }
        public CarDto Car { get; set; } = new();
        public StationDto Station { get; set; } = new();
    }

    public class CheckAvailabilityDto
    {
        [Required]
        public Guid CarId { get; set; }

        [Required]
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }

        [Required]
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ReturnDateTime { get; set; }
    }

    public class ConfirmBookingDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; } = string.Empty;
        
        // PaymentTransactionId is optional for Cash payments
        public string? PaymentTransactionId { get; set; }
    }

    public class CheckInDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        public string? CheckInNotes { get; set; }
        
        public string? CheckInPhotoUrl { get; set; }
    }

    public class CheckOutDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        public string? CheckOutNotes { get; set; }
        
        public string? CheckOutPhotoUrl { get; set; }
        
        public decimal LateFee { get; set; } = 0;
        
        public decimal DamageFee { get; set; } = 0;
    }

    public class BookingHistoryDto
    {
        public Guid BookingId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public string StationName { get; set; } = string.Empty;
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ActualReturnDateTime { get; set; }
        public decimal TotalAmount { get; set; }
        public BookingStatus BookingStatus { get; set; }
    }

    /// <summary>
    /// DTO cho việc approve hợp đồng (Bước 2)
    /// </summary>
    public class ApproveContractDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public bool ApproveContract { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO cho việc check-in với ký hợp đồng (Bước 3)
    /// </summary>
    public class CheckInWithContractDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public Guid StaffId { get; set; }
        
        [StringLength(500)]
        public string? CheckInNotes { get; set; }
        
        [StringLength(1000)]
        public string? CheckInPhotoUrl { get; set; }
        
        [Required]
        public string StaffSignature { get; set; } = string.Empty; // Chữ ký của staff
        
        [Required]
        public string CustomerSignature { get; set; } = string.Empty; // Chữ ký của khách hàng
    }

    /// <summary>
    /// DTO cho việc check-out và thanh toán tiền thuê (Bước 5)
    /// </summary>
    public class CheckOutWithPaymentDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public Guid StaffId { get; set; }
        
        [StringLength(500)]
        public string? CheckOutNotes { get; set; }
        
        [StringLength(1000)]
        public string? CheckOutPhotoUrl { get; set; }
        
        public decimal LateFee { get; set; } = 0;
        
        public decimal DamageFee { get; set; } = 0;
        
        [Required]
        public string PaymentMethod { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? TransactionId { get; set; } // Transaction ID cho thanh toán tiền thuê
    }
}