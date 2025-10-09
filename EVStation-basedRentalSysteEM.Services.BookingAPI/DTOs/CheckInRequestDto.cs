using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.BookingAPI.DTOs
{
    /// <summary>
    /// DTO for check-in process (Step 3: User picks up the car)
    /// </summary>
    public class CheckInRequestDto
    {
        [Required]
        public int BookingId { get; set; }

        [MaxLength(500)]
        public string? CheckInNotes { get; set; }

        [MaxLength(500)]
        public string? CheckInPhotoUrl { get; set; }

        public DateTime CheckInDateTime { get; set; } = DateTime.UtcNow;
    }
}

