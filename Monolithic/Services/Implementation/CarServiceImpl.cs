using AutoMapper;
using Microsoft.EntityFrameworkCore;
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
        private readonly IPhotoService _photoService;
        private readonly IMapper _mapper;

        public CarServiceImpl(ICarRepository carRepository, IPhotoService photoService, IMapper mapper)
        {
            _carRepository = carRepository;
            _photoService = photoService;
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

            // X? lý upload ?nh n?u có
            if (request.CarImage != null && request.CarImage.Length > 0)
            {
                var uploadResult = await _photoService.AddPhotoAsync(request.CarImage, "rental_app/cars");
                if (uploadResult.Error != null)
                {
                    return ResponseDto<CarDto>.Failure($"L?i upload ?nh: {uploadResult.Error.Message}");
                }

                car.ImageUrl = uploadResult.SecureUrl.ToString();
                car.CarImagePublicId = uploadResult.PublicId;
            }
            try
            {
                var created = await _carRepository.AddAsync(car);
                return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(created), "Car created");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
            {
                // X? lý l?i DbUpdateException/Khóa Trùng L?p 

                // Th??ng là mã l?i 2627 ho?c 2601 trong SQL Server
                if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx &&
                    (sqlEx.Number == 2627 || sqlEx.Number == 2601))
                {
                    // Trích xu?t thông tin c?n thi?t t? yêu c?u ?? t?o thông báo rõ ràng h?n
                    string licensePlate = request.LicensePlate; // Gi? s? CreateCarDto có thu?c tính CarNumber

                    // Tr? v? ResponseDto.Failure v?i thông báo l?i rõ ràng
                    return ResponseDto<CarDto>.Failure($"Error: The license plate '{licensePlate}' already exists in the system. Please check again.");
                }
                else
                {
                    // X? lý các l?i DbUpdateException khác không ph?i do khóa trùng l?p
                    // Ghi log l?i và tr? v? thông báo l?i chung
                    // Logger.LogError(ex, "L?i khi t?o xe.");
                    return ResponseDto<CarDto>.Failure("An error occurred while saving the data.");
                }

            }
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
            if (request.RentalPricePerDay.HasValue) car.RentalPricePerDay = request.RentalPricePerDay.Value;
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

        public async Task<ResponseDto<List<CarDto>>> SearchAvailableCarsAsync(
            Guid? stationId, string? brand, string? model,
            decimal? minPrice, decimal? maxPrice, decimal? minBatteryLevel,
            int page, int pageSize)
        {
            Expression<Func<Car, bool>> predicate = c => c.IsActive && c.IsAvailable;

            // Filter by station
            if (stationId.HasValue)
            {
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.CurrentStationId == stationId.Value;
            }

            // Filter by brand
            if (!string.IsNullOrWhiteSpace(brand))
            {
                var brandLower = brand.ToLower();
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.Brand.ToLower().Contains(brandLower);
            }

            // Filter by model
            if (!string.IsNullOrWhiteSpace(model))
            {
                var modelLower = model.ToLower();
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.Model.ToLower().Contains(modelLower);
            }

            // Filter by price range
            if (minPrice.HasValue)
            {
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.RentalPricePerHour >= minPrice.Value;
            }

            if (maxPrice.HasValue)
            {
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.RentalPricePerHour <= maxPrice.Value;
            }

            // Filter by battery level
            if (minBatteryLevel.HasValue)
            {
                var oldPredicate = predicate;
                predicate = c => oldPredicate.Compile()(c) && c.CurrentBatteryLevel >= minBatteryLevel.Value;
            }

            var (items, total) = await _carRepository.GetPagedAsync(
                page, pageSize, predicate, c => c.RentalPricePerHour, false);

            var dto = _mapper.Map<List<CarDto>>(items);
            return ResponseDto<List<CarDto>>.Success(dto, $"Found {total} available cars");
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

        public async Task<ResponseDto<string>> UpdateCarTechnicalStatusAsync(Guid id, UpdateCarTechnicalStatusDto request)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null || !car.IsActive)
                return ResponseDto<string>.Failure("Car not found");

            
            car.UpdatedAt = DateTime.UtcNow;

            await _carRepository.UpdateAsync(car);
            return ResponseDto<string>.Success(string.Empty, "Technical status updated successfully");
        }

        public async Task<ResponseDto<CarHandoverResponseDto>> RecordCarHandoverAsync(CarHandoverDto request, Guid staffId)
        {
            // Validate car exists
            var car = await _carRepository.GetByIdAsync(request.CarId);
            if (car == null || !car.IsActive)
                return ResponseDto<CarHandoverResponseDto>.Failure("Car not found");

            var photoUrls = new List<string>();
            var photoPublicIds = new List<string>();

            // Upload các ?nh bàn giao
            if (request.HandoverPhotos != null && request.HandoverPhotos.Any())
            {
                foreach (var photo in request.HandoverPhotos)
                {
                    var uploadResult = await _photoService.AddPhotoAsync(photo, $"rental_app/handovers/{request.BookingId}");
                    if (uploadResult.Error != null)
                    {
                        // N?u có l?i, xóa các ?nh ?ã upload tr??c ?ó
                        foreach (var publicId in photoPublicIds)
                        {
                            await _photoService.DeletePhotoAsync(publicId);
                        }
                        return ResponseDto<CarHandoverResponseDto>.Failure($"Error uploading photo: {uploadResult.Error.Message}");
                    }

                    photoUrls.Add(uploadResult.SecureUrl.ToString());
                    photoPublicIds.Add(uploadResult.PublicId);
                }
            }

            // T?o record handover
            var handover = new CarHandover
            {
                HandoverId = Guid.NewGuid(),
                BookingId = request.BookingId,
                CarId = request.CarId,
                StaffId = staffId,
                HandoverType = request.HandoverType.ToString(),
                PhotoUrls = string.Join(";", photoUrls),
                PhotoPublicIds = string.Join(";", photoPublicIds),
                Notes = request.Notes,
                BatteryLevelAtHandover = request.CurrentBatteryLevel,
                MileageReading = request.MileageReading,
                HandoverDateTime = DateTime.UtcNow
            };

            // Save to database (c?n implement repository method)
            // await _carHandoverRepository.AddAsync(handover);

            // C?p nh?t battery level c?a xe
            await UpdateCarBatteryLevelAsync(request.CarId, request.CurrentBatteryLevel);

            var response = new CarHandoverResponseDto
            {
                BookingId = handover.BookingId,
                CarId = handover.CarId,
                HandoverType = request.HandoverType,
                PhotoUrls = photoUrls,
                Notes = request.Notes ?? string.Empty,
                BatteryLevel = request.CurrentBatteryLevel,
                Mileage = request.MileageReading,
                HandoverDateTime = handover.HandoverDateTime,
                StaffId = staffId.ToString()
            };

            return ResponseDto<CarHandoverResponseDto>.Success(response, "Car handover recorded successfully");
        }
    }
}