using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Station;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class StationServiceImpl : IStationService
    {
        private readonly IStationRepository _stationRepository;
        private readonly IMapper _mapper;
        private readonly EVStationBasedRentalSystemDbContext _dbContext;

        public StationServiceImpl(IStationRepository stationRepository, IMapper mapper, EVStationBasedRentalSystemDbContext dbContext)
        {
            _stationRepository = stationRepository;
            _mapper = mapper;
            _dbContext = dbContext;
        }

        public async Task<ResponseDto<PaginationDto<StationDto>>> GetStationsAsync(PaginationRequestDto request)
        {
            Expression<Func<Station, bool>>? predicate = null;
            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var search = request.Search.Trim().ToLower();
                predicate = s => s.IsActive && (s.Name.ToLower().Contains(search) || s.Address.ToLower().Contains(search));
            }
            else
            {
                predicate = s => s.IsActive;
            }

            var (items, totalCount) = await _stationRepository.GetPagedAsync(
                request.Page,
                request.PageSize,
                predicate,
                s => s.Name,
                orderByDescending: false);

            var dtoList = _mapper.Map<List<StationDto>>(items);
            var pagination = new PaginationDto<StationDto>(dtoList, request.Page, request.PageSize, totalCount);
            return ResponseDto<PaginationDto<StationDto>>.Success(pagination);
        }

        public async Task<ResponseDto<StationDto>> GetStationByIdAsync(Guid id)
        {
            var station = await _stationRepository.GetStationWithCarsAsync(id);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<StationDto>.Failure("Station not found");
            }

            var dto = _mapper.Map<StationDto>(station);
            return ResponseDto<StationDto>.Success(dto);
        }

        public async Task<ResponseDto<StationDto>> CreateStationAsync(CreateStationDto request)
        {
            var station = _mapper.Map<Station>(request);
            station.AvailableSlots = request.TotalSlots;

            var created = await _stationRepository.AddAsync(station);
            var dto = _mapper.Map<StationDto>(created);
            return ResponseDto<StationDto>.Success(dto, "Station created");
        }

        public async Task<ResponseDto<StationDto>> UpdateStationAsync(Guid id, UpdateStationDto request)
        {
            var station = await _stationRepository.GetByIdAsync(id);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<StationDto>.Failure("Station not found");
            }

            if (!string.IsNullOrWhiteSpace(request.Name)) station.Name = request.Name;
            if (!string.IsNullOrWhiteSpace(request.Address)) station.Address = request.Address;
            if (request.TotalSlots.HasValue)
            {
                var diff = request.TotalSlots.Value - station.TotalSlots;
                station.TotalSlots = request.TotalSlots.Value;
                station.AvailableSlots = Math.Max(0, Math.Min(station.TotalSlots, station.AvailableSlots + diff));
            }
            station.UpdatedAt = DateTime.UtcNow;

            var updated = await _stationRepository.UpdateAsync(station);
            var dto = _mapper.Map<StationDto>(updated);
            return ResponseDto<StationDto>.Success(dto, "Station updated");
        }

        public async Task<ResponseDto<string>> DeleteStationAsync(Guid id)
        {
            var station = await _stationRepository.GetByIdAsync(id);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<string>.Failure("Station not found");
            }

            station.IsActive = false;
            station.UpdatedAt = DateTime.UtcNow;
            await _stationRepository.UpdateAsync(station);
            return ResponseDto<string>.Success(string.Empty, "Station deleted");
        }

        public async Task<ResponseDto<List<StationCarDto>>> GetAvailableCarsAtStationAsync(Guid stationId)
        {
            var station = await _stationRepository.GetStationWithCarsAsync(stationId);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<List<StationCarDto>>.Failure("Station not found");
            }

            var cars = station.Cars.Where(c => c.IsActive && c.IsAvailable).ToList();
            var dto = _mapper.Map<List<StationCarDto>>(cars);
            return ResponseDto<List<StationCarDto>>.Success(dto);
        }

        public async Task<ResponseDto<string>> UpdateStationSlotsAsync(Guid id, int totalSlots)
        {
            if (totalSlots <= 0)
            {
                return ResponseDto<string>.Failure("Total slots must be positive");
            }

            var station = await _stationRepository.GetByIdAsync(id);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<string>.Failure("Station not found");
            }

            var diff = totalSlots - station.TotalSlots;
            station.TotalSlots = totalSlots;
            station.AvailableSlots = Math.Max(0, Math.Min(station.TotalSlots, station.AvailableSlots + diff));
            station.UpdatedAt = DateTime.UtcNow;
            await _stationRepository.UpdateAsync(station);

            return ResponseDto<string>.Success(string.Empty, "Slots updated");
        }

        /// <summary>
        /// Tính toán lại AvailableSlots dựa trên số xe thực tế tại station
        /// AvailableSlots = TotalSlots - (số xe hiện tại tại station)
        /// </summary>
        public async Task<ResponseDto<string>> RecalculateStationAvailableSlotsAsync(Guid stationId)
        {
            var station = await _stationRepository.GetStationWithCarsAsync(stationId);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<string>.Failure("Station not found");
            }

            // Đếm số xe hiện tại tại station (kể cả available và unavailable)
            var carsAtStation = station.Cars.Count(c => c.IsActive);

            // AvailableSlots = TotalSlots - số xe đang có
            var calculatedAvailableSlots = station.TotalSlots - carsAtStation;

            // Đảm bảo không âm
            calculatedAvailableSlots = Math.Max(0, calculatedAvailableSlots);

            // Update
            station.AvailableSlots = calculatedAvailableSlots;
            station.UpdatedAt = DateTime.UtcNow;
            await _stationRepository.UpdateAsync(station);

            return ResponseDto<string>.Success(
                string.Empty, 
                $"Recalculated: {carsAtStation} cars at station, {calculatedAvailableSlots} slots available"
            );
        }

        /// <summary>
        /// Kiểm tra xem station có thể thêm xe mới không
        /// </summary>
        public async Task<bool> CanAddCarToStationAsync(Guid stationId)
        {
            var station = await _dbContext.Stations
                .Include(s => s.Cars.Where(c => c.IsActive))
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.IsActive);

            if (station == null) return false;

            // Đếm số xe hiện tại trong station
            var currentCarCount = station.Cars.Count(c => c.IsActive);
  
            // Kiểm tra xem còn slot trống không
            return currentCarCount < station.TotalSlots;
        }

        /// <summary>
        /// Cập nhật AvailableSlots khi có thay đổi xe (thêm/xóa/chuyển)
        /// </summary>
        public async Task<ResponseDto<string>> UpdateStationAvailableSlotsAsync(Guid stationId, int change)
        {
            var station = await _stationRepository.GetByIdAsync(stationId);
            if (station == null || !station.IsActive)
            {
                return ResponseDto<string>.Failure("Station not found");
            }

            // Cập nhật AvailableSlots
            station.AvailableSlots = Math.Max(0, Math.Min(station.TotalSlots, station.AvailableSlots + change));
            station.UpdatedAt = DateTime.UtcNow;
         
            await _stationRepository.UpdateAsync(station);
            return ResponseDto<string>.Success(string.Empty, "Station slots updated");
        }
    }
}