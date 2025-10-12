using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.BookingAPI.DTOs
{
    /// <summary>
    /// DTO for check-out process (Step 4: User returns the car)
    /// </summary>
    public class CheckOutRequestDto
    {
        [Required]
        public int BookingId { get; set; }

        [MaxLength(500)]
        public string? CheckOutNotes { get; set; }

        [MaxLength(500)]
        public string? CheckOutPhotoUrl { get; set; }

        public DateTime CheckOutDateTime { get; set; } = DateTime.UtcNow;

        // Optional fees
        [Range(0, 1000000)]
        public decimal? LateFee { get; set; }

        [Range(0, 1000000)]
        public decimal? DamageFee { get; set; }
    }
}

