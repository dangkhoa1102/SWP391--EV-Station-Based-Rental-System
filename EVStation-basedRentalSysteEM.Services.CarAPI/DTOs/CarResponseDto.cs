namespace EVStation_basedRentalSystem.Services.CarAPI.DTOs
{
    public class CarResponseDto
    {
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
    }
}

