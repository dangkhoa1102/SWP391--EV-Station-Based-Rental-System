using Monolithic.DTOs.Car;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface ICarService
    {
        Task<ResponseDto<PaginationDto<CarDto>>> GetCarsAsync(PaginationRequestDto request);
        Task<ResponseDto<CarDto>> GetCarByIdAsync(Guid id);
        Task<ResponseDto<CarDto>> CreateCarAsync(CreateCarDto request);
        Task<ResponseDto<CarDto>> UpdateCarAsync(Guid id, UpdateCarDto request);
        Task<ResponseDto<string>> DeleteCarAsync(Guid id);
        Task<ResponseDto<List<CarDto>>> GetAvailableCarsAsync(Guid stationId);
        Task<ResponseDto<List<CarDto>>> SearchAvailableCarsAsync(
            Guid? stationId, string? brand, string? model, 
            decimal? minPrice, decimal? maxPrice, decimal? minBatteryLevel,
            int page, int pageSize);
        Task<ResponseDto<string>> UpdateCarStatusAsync(Guid id, bool isAvailable);
        Task<ResponseDto<string>> UpdateCarBatteryLevelAsync(Guid id, decimal batteryLevel);
        Task<ResponseDto<string>> UpdateCarLocationAsync(Guid id, Guid stationId);
    }
}