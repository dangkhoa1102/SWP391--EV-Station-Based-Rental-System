namespace EVStation_basedRentalSystem.Services.CarAPI.Clients
{
    /// <summary>
    /// Interface for communicating with StationAPI
    /// </summary>
    public interface IStationClient
    {
        /// <summary>
        /// Check if a station exists and is active
        /// </summary>
        Task<bool> StationExistsAsync(int stationId);

        /// <summary>
        /// Get station details by ID
        /// </summary>
        Task<StationDto?> GetStationByIdAsync(int stationId);

        /// <summary>
        /// Check if station has available slots
        /// </summary>
        Task<bool> HasAvailableSlotsAsync(int stationId);
    }
}

