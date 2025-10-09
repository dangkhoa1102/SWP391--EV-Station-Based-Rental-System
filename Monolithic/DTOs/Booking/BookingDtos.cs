using System.ComponentModel.DataAnnotations;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Station;

namespace Monolithic.DTOs.Booking
{
    public class BookingDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public Guid PickupStationId { get; set; }
        public string PickupStationName { get; set; } = string.Empty;
        public Guid? DropoffStationId { get; set; }
        public string? DropoffStationName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateBookingDto
    {
        [Required]
        public Guid CarId { get; set; }

        [Required]
        public Guid PickupStationId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }
    }

    public class UpdateBookingDto
    {
        public Guid? DropoffStationId { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Status { get; set; }
    }

    public class BookingStatusDto
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal TotalAmount { get; set; }
        public CarDto Car { get; set; } = new();
        public StationDto PickupStation { get; set; } = new();
        public StationDto? DropoffStation { get; set; }
    }

    public enum BookingStatus
    {
        Pending = 0,
        Confirmed = 1,
        Active = 2,
        Completed = 3,
        Cancelled = 4
    }
}