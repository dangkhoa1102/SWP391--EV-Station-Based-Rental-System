using System.ComponentModel.DataAnnotations;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Station;
using Monolithic.Models;

namespace Monolithic.DTOs.Booking
{
    public class BookingDto
    {
        public Guid BookingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public Guid PickupStationId { get; set; }
        public string PickupStationName { get; set; } = string.Empty;
        public Guid? ReturnStationId { get; set; }
        public string? ReturnStationName { get; set; }
        public DateTime PickupDateTime { get; set; }
        public DateTime ExpectedReturnDateTime { get; set; }
        public DateTime? ActualReturnDateTime { get; set; }
        public BookingStatus BookingStatus { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal DailyRate { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateBookingDto
    {
        [Required(ErrorMessage = "Car ID is required")]
        public Guid CarId { get; set; }

        [Required(ErrorMessage = "Pickup station is required")]
        public Guid PickupStationId { get; set; }

        public Guid? ReturnStationId { get; set; }

        [Required(ErrorMessage = "Pickup date and time is required")]
        public DateTime PickupDateTime { get; set; }

        [Required(ErrorMessage = "Expected return date and time is required")]
        public DateTime ExpectedReturnDateTime { get; set; }
    }

    public class UpdateBookingDto
    {
        public Guid? ReturnStationId { get; set; }
        public DateTime? ExpectedReturnDateTime { get; set; }
        public BookingStatus? BookingStatus { get; set; }
    }

    public class BookingStatusDto
    {
        public Guid BookingId { get; set; }
        public BookingStatus BookingStatus { get; set; }
        public DateTime PickupDateTime { get; set; }
        public DateTime ExpectedReturnDateTime { get; set; }
        public DateTime? ActualReturnDateTime { get; set; }
        public decimal TotalAmount { get; set; }
        public CarDto Car { get; set; } = new();
        public StationDto PickupStation { get; set; } = new();
        public StationDto? ReturnStation { get; set; }
    }

    public class CheckAvailabilityDto
    {
        [Required]
        public Guid CarId { get; set; }

        [Required]
        public DateTime PickupDateTime { get; set; }

        [Required]
        public DateTime ReturnDateTime { get; set; }
    }

    public class ConfirmBookingDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; } = string.Empty;
        
        [Required]
        public string PaymentTransactionId { get; set; } = string.Empty;
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
        public string PickupStationName { get; set; } = string.Empty;
        public string ReturnStationName { get; set; } = string.Empty;
        public DateTime PickupDateTime { get; set; }
        public DateTime? ActualReturnDateTime { get; set; }
        public decimal TotalAmount { get; set; }
        public BookingStatus BookingStatus { get; set; }
    }
}