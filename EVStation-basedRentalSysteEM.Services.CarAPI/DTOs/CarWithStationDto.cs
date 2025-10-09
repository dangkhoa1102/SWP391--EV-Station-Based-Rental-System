namespace EVStation_basedRentalSystem.Services.CarAPI.DTOs
{
    /// <summary>
    /// DTO for Car with Station details
    /// </summary>
    public class CarWithStationDto
    {
        // Car details
        public int CarId { get; set; }
        public int StationId { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string? Color { get; set; }
        public int SeatCapacity { get; set; }
        public decimal BatteryCapacity { get; set; }
        public decimal CurrentBatteryLevel { get; set; }
        public int MaxRange { get; set; }
        public string? ChargerType { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal DailyRate { get; set; }
        public decimal DepositAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }

        // Station details
        public StationInfo? Station { get; set; }
    }

    public class StationInfo
    {
        public string StationName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int AvailableSlots { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}

