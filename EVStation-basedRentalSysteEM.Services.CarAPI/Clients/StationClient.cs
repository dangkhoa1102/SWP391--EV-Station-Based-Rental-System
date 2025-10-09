using System.Text.Json;

namespace EVStation_basedRentalSystem.Services.CarAPI.Clients
{
    /// <summary>
    /// HTTP Client for communicating with StationAPI
    /// </summary>
    public class StationClient : IStationClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<StationClient> _logger;

        public StationClient(HttpClient httpClient, ILogger<StationClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> StationExistsAsync(int stationId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/station/{stationId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Station {stationId} not found or not accessible");
                    return false;
                }

                var content = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<StationApiResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return apiResponse?.IsSuccess == true && apiResponse.Data?.IsActive == true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking station existence for StationId: {stationId}");
                return false;
            }
        }

        public async Task<StationDto?> GetStationByIdAsync(int stationId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/station/{stationId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Station {stationId} not found");
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<StationApiResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return apiResponse?.Data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting station details for StationId: {stationId}");
                return null;
            }
        }

        public async Task<bool> HasAvailableSlotsAsync(int stationId)
        {
            try
            {
                var station = await GetStationByIdAsync(stationId);
                return station != null && station.AvailableSlots > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking available slots for StationId: {stationId}");
                return false;
            }
        }
    }
}

