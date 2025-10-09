using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.CarAPI.Models
{
    /// <summary>
    /// Represents an Electric Vehicle available for rent in the system
    /// </summary>
    public class Car
    {
        [Key]
        public int CarId { get; set; }

        [Required]
        public int StationId { get; set; }
        [Required]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Model { get; set; } = string.Empty;

        [Range(2000, 2100)]
        public int Year { get; set; }

        [MaxLength(50)]
        public string? Color { get; set; }

        [Range(2, 20)]
        public int SeatCapacity { get; set; } = 4;

        // ==================== VEHICLE SPECIFICATIONS ====================
        [Range(0, 500)]
        public decimal BatteryCapacity { get; set; }  // in kWh (e.g., 60 kWh)

        [Range(0, 100)]
        public decimal CurrentBatteryLevel { get; set; } = 100;  // Percentage (0-100%)

        [Range(0, 1000)]
        public int MaxRange { get; set; }  // Maximum range in km on full charge

        [MaxLength(50)]
        public string? ChargerType { get; set; }  // e.g., "Type 2", "CCS", "CHAdeMO"

        // ==================== PRICING ====================
        [Range(0, 10000000)]
        public decimal HourlyRate { get; set; }  // Price per hour in VND

        [Range(0, 100000000)]
        public decimal DailyRate { get; set; }  // Price per day in VND

        [Range(0, 1000000)]
        public decimal DepositAmount { get; set; }  // Security deposit in VND

        // ==================== VEHICLE STATUS ====================
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Available";  
        // Available, Rented, Maintenance, Charging, OutOfService

        [MaxLength(500)]
        public string? ImageUrl { get; set; }  // URL to car image

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;  // Soft delete flag

        // ==================== ADDITIONAL INFO ====================
        [MaxLength(1000)]
        public string? Description { get; set; }  // Detailed description
    }
}

