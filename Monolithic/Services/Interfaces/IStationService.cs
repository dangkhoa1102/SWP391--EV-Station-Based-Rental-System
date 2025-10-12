using Monolithic.DTOs.Station;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IStationService
    {
        Task<ResponseDto<PaginationDto<StationDto>>> GetStationsAsync(PaginationRequestDto request);
        Task<ResponseDto<StationDto>> GetStationByIdAsync(Guid id);
        Task<ResponseDto<StationDto>> CreateStationAsync(CreateStationDto request);
        Task<ResponseDto<StationDto>> UpdateStationAsync(Guid id, UpdateStationDto request);
        Task<ResponseDto<string>> DeleteStationAsync(Guid id);
        Task<ResponseDto<List<StationCarDto>>> GetAvailableCarsAtStationAsync(Guid stationId);
        Task<ResponseDto<string>> UpdateStationSlotsAsync(Guid id, int totalSlots);
    }
}