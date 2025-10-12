using EVStation_basedRendtalSystem.Services.StationAPI.DTOs;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Services.IService
{
    public interface IStationService
    {
        Task<ApiResponseDto> CreateStationAsync(CreateStationRequestDto request);
        Task<ApiResponseDto> GetStationByIdAsync(int stationId);
        Task<ApiResponseDto> GetAllStationsAsync();
        Task<ApiResponseDto> GetStationsByStatusAsync(string status);
        Task<ApiResponseDto> UpdateStationAsync(int stationId, UpdateStationRequestDto request);
        Task<ApiResponseDto> DeleteStationAsync(int stationId);
        Task<ApiResponseDto> GetStationsWithAvailableSlotsAsync();
        Task<ApiResponseDto> SearchStationsAsync(string searchTerm);
        Task<ApiResponseDto> UpdateAvailableSlotsAsync(int stationId, int availableSlots);
        Task<ApiResponseDto> GetStationStatisticsAsync();
    }
}

