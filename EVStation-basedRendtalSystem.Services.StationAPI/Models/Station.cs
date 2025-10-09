using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Models
{
    public class Station
    {
        [Key]
        public int StationId { get; set; }

        [Required]
        [MaxLength(200)]
        public string StationName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public int TotalParkingSlots { get; set; } = 0;

        public int AvailableSlots { get; set; } = 0;

        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Inactive, Under Maintenance

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;
    }
}
