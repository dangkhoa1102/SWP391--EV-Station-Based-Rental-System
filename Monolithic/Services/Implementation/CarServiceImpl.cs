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
        private readonly IStationService _stationService;

        public CarServiceImpl(ICarRepository carRepository, IPhotoService photoService, IMapper mapper, IStationService stationService)
        {
            _carRepository = carRepository;
            _photoService = photoService;
            _mapper = mapper;
            _stationService = stationService;
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
            // Ki?m tra station c� ?? ch? kh�ng
            var canAddCar = await _stationService.CanAddCarToStationAsync(request.CurrentStationId);
            if (!canAddCar)
            {
                return ResponseDto<CarDto>.Failure("Station đã đầy, không thể thêm xe mới vào station lúc này.");
            }

            var car = _mapper.Map<Car>(request);

            // X? l� upload ?nh n?u c�
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

                // C?p nh?t AvailableSlots c?a station (gi?m 1)
                await _stationService.UpdateStationAvailableSlotsAsync(request.CurrentStationId, -1);

                return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(created), "Car created");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
            {
                // X? l� l?i DbUpdateException/Kh�a Tr�ng L?p

                // Th??ng l� m� l?i 2627 ho?c 2601 trong SQL Server
                if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx &&
                    (sqlEx.Number == 2627 || sqlEx.Number == 2601))
                {
                    // Tr�ch xu?t th�ng tin c?n thi?t t? y�u c?u ?? t?o th�ng b�o r� r�ng h?n
                    string licensePlate = request.LicensePlate; // Gi? s? CreateCarDto c� thu?c t�nh CarNumber

                    // Tr? v? ResponseDto.Failure v?i th�ng b�o l?i r� r�ng
                    return ResponseDto<CarDto>.Failure($"Error: The license plate '{licensePlate}' already exists in the system. Please check again.");
                }
                else
                {
                    // X? l� c�c l?i DbUpdateException kh�c kh�ng ph?i do kh�a tr�ng l?p
                    // Ghi log l?i v� tr? v? th�ng b�o l?i chung
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
            if (request.Seats.HasValue) car.Seats = request.Seats.Value;
            car.UpdatedAt = DateTime.UtcNow;

            var updated = await _carRepository.UpdateAsync(car);
            return ResponseDto<CarDto>.Success(_mapper.Map<CarDto>(updated), "Car updated");
        }

        public async Task<ResponseDto<string>> DeleteCarAsync(Guid id)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null || !car.IsActive) return ResponseDto<string>.Failure("Car not found");
       
  var stationId = car.CurrentStationId;
    
    car.IsActive = false;
       car.UpdatedAt = DateTime.UtcNow;
            await _carRepository.UpdateAsync(car);
     
      // C?p nh?t AvailableSlots c?a station (t?ng 1 slot)
            await _stationService.UpdateStationAvailableSlotsAsync(stationId, 1);
          
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
            // L?y th�ng tin xe hi?n t?i
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null || !car.IsActive)
            {
                return ResponseDto<string>.Failure("Car not found");
            }

            // N?u kh�ng ph?i chuy?n station th� kh�ng c?n validation
            if (car.CurrentStationId == stationId)
            {
                return ResponseDto<string>.Success(string.Empty, "Car is already at this station");
            }

            // Ki?m tra station ?�ch c� ?? ch? kh�ng
            var canAddCar = await _stationService.CanAddCarToStationAsync(stationId);
            if (!canAddCar)
            {
                return ResponseDto<string>.Failure("Station ?�ch ?� ??y, kh�ng th? chuy?n xe v�o station n�y.");
            }

            var oldStationId = car.CurrentStationId;
            
            var ok = await _carRepository.UpdateCarLocationAsync(id, stationId);
            if (!ok) return ResponseDto<string>.Failure("Car not found");

            // C?p nh?t AvailableSlots cho c? 2 station
            // Station c?: t?ng 1 slot
            await _stationService.UpdateStationAvailableSlotsAsync(oldStationId, 1);
            // Station m?i: gi?m 1 slot
            await _stationService.UpdateStationAvailableSlotsAsync(stationId, -1);

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

            // Upload c�c ?nh b�n giao
            if (request.HandoverPhotos != null && request.HandoverPhotos.Any())
            {
                foreach (var photo in request.HandoverPhotos)
                {
                    var uploadResult = await _photoService.AddPhotoAsync(photo, $"rental_app/handovers/{request.BookingId}");
                    if (uploadResult.Error != null)
                    {
                        // N?u c� l?i, x�a c�c ?nh ?� upload tr??c ?�
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

        public async Task<ResponseDto<string>> SoftDeleteCarAsync(Guid id)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null)
                return ResponseDto<string>.Failure("Xe không tìm thấy");

            if (!car.IsActive)
                return ResponseDto<string>.Failure("Xe này đã bị xóa trước đây");

            var stationId = car.CurrentStationId;

            car.IsActive = false;
            car.UpdatedAt = DateTime.UtcNow;
            await _carRepository.UpdateAsync(car);

            // Cập nhật AvailableSlots của station (tăng 1 slot)
            await _stationService.UpdateStationAvailableSlotsAsync(stationId, 1);

            return ResponseDto<string>.Success(string.Empty, "Xe đã được xóa (soft delete)");
        }

        public async Task<ResponseDto<string>> RestoreCarAsync(Guid id)
        {
            var car = await _carRepository.GetByIdAsync(id);
            if (car == null)
                return ResponseDto<string>.Failure("Xe không tìm thấy");

            if (car.IsActive)
                return ResponseDto<string>.Failure("Xe này không bị xóa, không cần khôi phục");

            var stationId = car.CurrentStationId;

            // Kiểm tra xem station còn đủ slot không
            var canAddCar = await _stationService.CanAddCarToStationAsync(stationId);
            if (!canAddCar)
            {
                return ResponseDto<string>.Failure("Trạm đã đầy, không thể khôi phục xe vào trạm này. Vui lòng kiểm tra lại dung lượng trạm.");
            }

            car.IsActive = true;
            car.UpdatedAt = DateTime.UtcNow;
            await _carRepository.UpdateAsync(car);

            // Cập nhật AvailableSlots của station (giảm 1 slot)
            await _stationService.UpdateStationAvailableSlotsAsync(stationId, -1);

            return ResponseDto<string>.Success(string.Empty, "Xe đã được khôi phục thành công");
        }

        public async Task<ResponseDto<List<CarDto>>> GetDeletedCarsAsync()
        {
            var cars = await _carRepository.FindAsync(c => !c.IsActive);
            var dtos = _mapper.Map<List<CarDto>>(cars.ToList());
            return ResponseDto<List<CarDto>>.Success(dtos);
        }
    }
}