using EVStation_basedRentalSystem.Services.CarAPI.DTOs;

namespace EVStation_basedRentalSystem.Services.CarAPI.Services.IService
{
    public interface ICarService
    {
        Task<ApiResponseDto> CreateCarAsync(CreateCarRequestDto request);
        Task<ApiResponseDto> GetCarByIdAsync(int carId);
        Task<ApiResponseDto> GetAllCarsAsync();
        Task<ApiResponseDto> GetCarsByStationIdAsync(int stationId);
        Task<ApiResponseDto> GetCarsByStatusAsync(string status);
        Task<ApiResponseDto> GetAvailableCarsAsync();
        Task<ApiResponseDto> UpdateCarAsync(int carId, UpdateCarRequestDto request);
        Task<ApiResponseDto> DeleteCarAsync(int carId);
        Task<ApiResponseDto> SearchCarsAsync(string searchTerm);
        Task<ApiResponseDto> GetCarsByBrandAsync(string brand);
        Task<ApiResponseDto> GetCarsByPriceRangeAsync(decimal minPrice, decimal maxPrice);
        Task<ApiResponseDto> UpdateBatteryLevelAsync(int carId, decimal batteryLevel);
        Task<ApiResponseDto> UpdateStatusAsync(int carId, string status);
        Task<ApiResponseDto> GetCarStatisticsAsync();
        Task<ApiResponseDto> GetCarWithStationDetailsAsync(int carId);
    }
}

