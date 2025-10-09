namespace EVStation_basedRentalSystem.Services.CarAPI.Clients
{
    /// <summary>
    /// DTO for Station data from StationAPI
    /// </summary>
    public class StationDto
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

    /// <summary>
    /// Standard API response from StationAPI
    /// </summary>
    public class StationApiResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public StationDto? Data { get; set; }
    }
}

