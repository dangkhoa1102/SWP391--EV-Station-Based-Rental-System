using AutoMapper;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class CarServiceImpl : ICarService
    {
        private readonly ICarRepository _carRepository;
        private readonly IMapper _mapper;

        public CarServiceImpl(ICarRepository carRepository, IMapper mapper)
        {
            _carRepository = carRepository;
            _mapper = mapper;
        }

        public async Task<ResponseDto<PaginationDto<CarDto>>> GetCarsAsync(PaginationRequestDto request)
        {
            Expression<Func<Car, bool>>? predicate = null;
            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var search = request.Search.Trim().ToLower();
                predicate = c => c.IsActive && (c.Brand.ToLower().Contains(search) || c.Model.ToLower().Contains(search) || c.LicensePlate.ToLower().Contains(search));
            }
            else
            {
                predicate = c => c.IsActive;
            }

            var (items, total) = await _carRepository.GetPagedAsync(request.Page, request.PageSize, predicate, c => c.CreatedAt, true);
            var dto = _mapper.Map<List<CarDto>>(items);
            var pagination = new PaginationDto<CarDto>(dto, request.Page, request.PageSize, total);
            return ResponseDto<PaginationDto<CarDto>>.Success(pagination);
        }

        public async Task<ResponseDto<CarDto>> GetCarByIdAsync(Guid id)
        {
            var car = await _carRepository.GetCarWithStationAsync(id);
            if (car == null || !car.IsActive) return ResponseDto<CarDto>.Failure("Car not found");
            return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(car));
        }

        public async Task<ResponseDto<CarDto>> CreateCarAsync(CreateCarDto request)
        {
            var car = _mapper.Map<Car>(request);
            var created = await _carRepository.AddAsync(car);
            return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(created), "Car created");
        }

        public async Task<ResponseDto<CarDto>> UpdateCarAsync(Guid id, UpdateCarDto request)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null || !car.IsActive) return ResponseDto<CarDto>.Failure("Car not found");

            if (!string.IsNullOrWhiteSpace(request.Brand)) car.Brand = request.Brand;
            if (!string.IsNullOrWhiteSpace(request.Model)) car.Model = request.Model;
            if (!string.IsNullOrWhiteSpace(request.Color)) car.Color = request.Color;
            if (!string.IsNullOrWhiteSpace(request.LicensePlate)) car.LicensePlate = request.LicensePlate;
            if (request.BatteryCapacity.HasValue) car.BatteryCapacity = request.BatteryCapacity.Value;
            if (request.CurrentBatteryLevel.HasValue) car.CurrentBatteryLevel = request.CurrentBatteryLevel.Value;
            if (request.RentalPricePerHour.HasValue) car.RentalPricePerHour = request.RentalPricePerHour.Value;
            car.UpdatedAt = DateTime.UtcNow;

            var updated = await _carRepository.UpdateAsync(car);
            return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(updated), "Car updated");
        }

        public async Task<ResponseDto<string>> DeleteCarAsync(Guid id)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null || !car.IsActive) return ResponseDto<string>.Failure("Car not found");
            car.IsActive = false;
            car.UpdatedAt = DateTime.UtcNow;
            await _carRepository.UpdateAsync(car);
            return ResponseDto<string>.Success(string.Empty, "Car deleted");
        }

        public async Task<ResponseDto<List<CarDto>>> GetAvailableCarsAsync(Guid stationId)
        {
            var cars = await _carRepository.GetAvailableCarsByStationAsync(stationId);
            return ResponseDto<List<CarDto>>.Success(_mapper.Map<List<CarDto>>(cars));
        }

        public async Task<ResponseDto<string>> UpdateCarStatusAsync(Guid id, bool isAvailable)
        {
            var ok = await _carRepository.UpdateCarStatusAsync(id, isAvailable);
            if (!ok) return ResponseDto<string>.Failure("Car not found");
            return ResponseDto<string>.Success(string.Empty, "Status updated");
        }

        public async Task<ResponseDto<string>> UpdateCarBatteryLevelAsync(Guid id, decimal batteryLevel)
        {
            var ok = await _carRepository.UpdateCarBatteryLevelAsync(id, batteryLevel);
            if (!ok) return ResponseDto<string>.Failure("Car not found");
            return ResponseDto<string>.Success(string.Empty, "Battery updated");
        }

        public async Task<ResponseDto<string>> UpdateCarLocationAsync(Guid id, Guid stationId)
        {
            var ok = await _carRepository.UpdateCarLocationAsync(id, stationId);
            if (!ok) return ResponseDto<string>.Failure("Car not found");
            return ResponseDto<string>.Success(string.Empty, "Location updated");
        }
    }
}