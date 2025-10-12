using System.ComponentModel.DataAnnotations;

namespace EVStation_basedRentalSystem.Services.CarAPI.DTOs
{
    /// <summary>
    /// DTO for partial update - all fields are optional
    /// Only provided fields will be updated
    /// </summary>
    public class UpdateCarRequestDto
    {
        public int? StationId { get; set; }

        [MaxLength(20, ErrorMessage = "License plate cannot exceed 20 characters")]
        public string? LicensePlate { get; set; }

        [MaxLength(100, ErrorMessage = "Brand cannot exceed 100 characters")]
        public string? Brand { get; set; }

        [MaxLength(100, ErrorMessage = "Model cannot exceed 100 characters")]
        public string? Model { get; set; }

        [Range(2000, 2100, ErrorMessage = "Year must be between 2000 and 2100")]
        public int? Year { get; set; }

        [MaxLength(50, ErrorMessage = "Color cannot exceed 50 characters")]
        public string? Color { get; set; }

        [Range(2, 20, ErrorMessage = "Seat capacity must be between 2 and 20")]
        public int? SeatCapacity { get; set; }

        [Range(0, 500, ErrorMessage = "Battery capacity must be between 0 and 500 kWh")]
        public decimal? BatteryCapacity { get; set; }

        [Range(0, 100, ErrorMessage = "Current battery level must be between 0 and 100%")]
        public decimal? CurrentBatteryLevel { get; set; }

        [Range(0, 1000, ErrorMessage = "Max range must be between 0 and 1000 km")]
        public int? MaxRange { get; set; }

        [MaxLength(50, ErrorMessage = "Charger type cannot exceed 50 characters")]
        public string? ChargerType { get; set; }

        [Range(0, 10000000, ErrorMessage = "Hourly rate must be between 0 and 10,000,000 VND")]
        public decimal? HourlyRate { get; set; }

        [Range(0, 100000000, ErrorMessage = "Daily rate must be between 0 and 100,000,000 VND")]
        public decimal? DailyRate { get; set; }

        [Range(0, 1000000, ErrorMessage = "Deposit amount must be between 0 and 1,000,000 VND")]
        public decimal? DepositAmount { get; set; }

        [MaxLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
        public string? Status { get; set; }

        [MaxLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
        public string? ImageUrl { get; set; }

        [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }
    }
}

