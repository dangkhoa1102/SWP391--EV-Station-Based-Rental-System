using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.BookingAPI.DTOs
{
    /// <summary>
    /// DTO for creating a new booking (Step 1: User selects car and dates)
    /// </summary>
    public class CreateBookingRequestDto
    {
        [Required(ErrorMessage = "User ID is required")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Car ID is required")]
        public int CarId { get; set; }

        [Required(ErrorMessage = "Pickup station is required")]
        public int PickupStationId { get; set; }

        [Required(ErrorMessage = "Return station is required")]
        public int ReturnStationId { get; set; }

        [Required(ErrorMessage = "Pickup date and time is required")]
        public DateTime PickupDateTime { get; set; }

        [Required(ErrorMessage = "Expected return date and time is required")]
        public DateTime ExpectedReturnDateTime { get; set; }
    }
}

