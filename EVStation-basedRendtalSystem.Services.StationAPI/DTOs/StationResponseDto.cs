namespace EVStation_basedRendtalSystem.Services.StationAPI.DTOs
{
    public class StationResponseDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int TotalParkingSlots { get; set; }
        public int AvailableSlots { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }
}

