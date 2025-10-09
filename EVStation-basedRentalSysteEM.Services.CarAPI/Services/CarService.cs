using EVStation_basedRentalSystem.Services.CarAPI.Clients;
using EVStation_basedRentalSystem.Services.CarAPI.DTOs;
using EVStation_basedRentalSystem.Services.CarAPI.Models;
using EVStation_basedRentalSystem.Services.CarAPI.Repository.IRepository;
using EVStation_basedRentalSystem.Services.CarAPI.Services.IService;

namespace EVStation_basedRentalSystem.Services.CarAPI.Services
{
    public class CarService : ICarService
    {
        private readonly ICarRepository _carRepository;
        private readonly IStationClient _stationClient;

        public CarService(ICarRepository carRepository, IStationClient stationClient)
        {
            _carRepository = carRepository;
            _stationClient = stationClient;
        }

        public async Task<ApiResponseDto> CreateCarAsync(CreateCarRequestDto request)
        {
            try
            {
                // Validate that station exists
                var stationExists = await _stationClient.StationExistsAsync(request.StationId);
                if (!stationExists)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Station with ID {request.StationId} does not exist or is not active.",
                        Data = null
                    };
                }

                // Check if car with same license plate already exists
                var existingCar = await _carRepository.GetByLicensePlateAsync(request.LicensePlate);
                if (existingCar != null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car with this license plate already exists.",
                        Data = null
                    };
                }

                var car = new Car
                {
                    StationId = request.StationId,
                    LicensePlate = request.LicensePlate,
                    Brand = request.Brand,
                    Model = request.Model,
                    Year = request.Year,
                    Color = request.Color,
                    SeatCapacity = request.SeatCapacity,
                    BatteryCapacity = request.BatteryCapacity,
                    CurrentBatteryLevel = request.CurrentBatteryLevel,
                    MaxRange = request.MaxRange,
                    ChargerType = request.ChargerType,
                    HourlyRate = request.HourlyRate,
                    DailyRate = request.DailyRate,
                    DepositAmount = request.DepositAmount,
                    Status = request.Status,
                    ImageUrl = request.ImageUrl,
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var createdCar = await _carRepository.CreateAsync(car);
                var response = MapToResponseDto(createdCar);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car created successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error creating car: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarByIdAsync(int carId)
        {
            try
            {
                var car = await _carRepository.GetByIdAsync(carId);
                if (car == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                var response = MapToResponseDto(car);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving car: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetAllCarsAsync()
        {
            try
            {
                var cars = await _carRepository.GetAllAsync();
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarsByStationIdAsync(int stationId)
        {
            try
            {
                var cars = await _carRepository.GetByStationIdAsync(stationId);
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarsByStatusAsync(string status)
        {
            try
            {
                var cars = await _carRepository.GetByStatusAsync(status);
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetAvailableCarsAsync()
        {
            try
            {
                var cars = await _carRepository.GetAvailableCarsAsync();
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Available cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving available cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateCarAsync(int carId, UpdateCarRequestDto request)
        {
            try
            {
                var car = await _carRepository.GetByIdAsync(carId);
                if (car == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                // If license plate is being updated, check if it already exists
                if (!string.IsNullOrEmpty(request.LicensePlate) && request.LicensePlate != car.LicensePlate)
                {
                    var existingCar = await _carRepository.GetByLicensePlateAsync(request.LicensePlate);
                    if (existingCar != null && existingCar.CarId != carId)
                    {
                        return new ApiResponseDto
                        {
                            IsSuccess = false,
                            Message = "Another car with this license plate already exists.",
                            Data = null
                        };
                    }
                }

                // Partial update - only update fields that are provided
                if (request.StationId.HasValue)
                {
                    // Validate new station exists
                    var stationExists = await _stationClient.StationExistsAsync(request.StationId.Value);
                    if (!stationExists)
                    {
                        return new ApiResponseDto
                        {
                            IsSuccess = false,
                            Message = $"Station with ID {request.StationId.Value} does not exist or is not active.",
                            Data = null
                        };
                    }
                    car.StationId = request.StationId.Value;
                }

                if (!string.IsNullOrEmpty(request.LicensePlate))
                    car.LicensePlate = request.LicensePlate;

                if (!string.IsNullOrEmpty(request.Brand))
                    car.Brand = request.Brand;

                if (!string.IsNullOrEmpty(request.Model))
                    car.Model = request.Model;

                if (request.Year.HasValue)
                    car.Year = request.Year.Value;

                if (request.Color != null)
                    car.Color = request.Color;

                if (request.SeatCapacity.HasValue)
                    car.SeatCapacity = request.SeatCapacity.Value;

                if (request.BatteryCapacity.HasValue)
                    car.BatteryCapacity = request.BatteryCapacity.Value;

                if (request.CurrentBatteryLevel.HasValue)
                    car.CurrentBatteryLevel = request.CurrentBatteryLevel.Value;

                if (request.MaxRange.HasValue)
                    car.MaxRange = request.MaxRange.Value;

                if (request.ChargerType != null)
                    car.ChargerType = request.ChargerType;

                if (request.HourlyRate.HasValue)
                    car.HourlyRate = request.HourlyRate.Value;

                if (request.DailyRate.HasValue)
                    car.DailyRate = request.DailyRate.Value;

                if (request.DepositAmount.HasValue)
                    car.DepositAmount = request.DepositAmount.Value;

                if (!string.IsNullOrEmpty(request.Status))
                    car.Status = request.Status;

                if (request.ImageUrl != null)
                    car.ImageUrl = request.ImageUrl;

                if (request.Description != null)
                    car.Description = request.Description;

                var updatedCar = await _carRepository.UpdateAsync(car);
                var response = MapToResponseDto(updatedCar);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car updated successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating car: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> DeleteCarAsync(int carId)
        {
            try
            {
                var result = await _carRepository.DeleteAsync(carId);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car deleted successfully",
                    Data = null
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error deleting car: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> SearchCarsAsync(string searchTerm)
        {
            try
            {
                var cars = await _carRepository.SearchCarsAsync(searchTerm);
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Search completed successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error searching cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarsByBrandAsync(string brand)
        {
            try
            {
                var cars = await _carRepository.GetCarsByBrandAsync(brand);
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarsByPriceRangeAsync(decimal minPrice, decimal maxPrice)
        {
            try
            {
                if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Invalid price range",
                        Data = null
                    };
                }

                var cars = await _carRepository.GetCarsByPriceRangeAsync(minPrice, maxPrice);
                var response = cars.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Cars retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving cars: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateBatteryLevelAsync(int carId, decimal batteryLevel)
        {
            try
            {
                if (batteryLevel < 0 || batteryLevel > 100)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Battery level must be between 0 and 100",
                        Data = null
                    };
                }

                var result = await _carRepository.UpdateBatteryLevelAsync(carId, batteryLevel);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Battery level updated successfully",
                    Data = new { CarId = carId, BatteryLevel = batteryLevel }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating battery level: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateStatusAsync(int carId, string status)
        {
            try
            {
                var result = await _carRepository.UpdateStatusAsync(carId, status);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Status updated successfully",
                    Data = new { CarId = carId, Status = status }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating status: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarStatisticsAsync()
        {
            try
            {
                var totalCars = await _carRepository.GetTotalCarsCountAsync();
                var availableCars = await _carRepository.GetAvailableCarsCountAsync();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Statistics retrieved successfully",
                    Data = new
                    {
                        TotalCars = totalCars,
                        AvailableCars = availableCars,
                        RentedCars = totalCars - availableCars
                    }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving statistics: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarWithStationDetailsAsync(int carId)
        {
            try
            {
                var car = await _carRepository.GetByIdAsync(carId);
                if (car == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found",
                        Data = null
                    };
                }

                // Get station details
                var station = await _stationClient.GetStationByIdAsync(car.StationId);

                var response = new CarWithStationDto
                {
                    CarId = car.CarId,
                    StationId = car.StationId,
                    LicensePlate = car.LicensePlate,
                    Brand = car.Brand,
                    Model = car.Model,
                    Year = car.Year,
                    Color = car.Color,
                    SeatCapacity = car.SeatCapacity,
                    BatteryCapacity = car.BatteryCapacity,
                    CurrentBatteryLevel = car.CurrentBatteryLevel,
                    MaxRange = car.MaxRange,
                    ChargerType = car.ChargerType,
                    HourlyRate = car.HourlyRate,
                    DailyRate = car.DailyRate,
                    DepositAmount = car.DepositAmount,
                    Status = car.Status,
                    ImageUrl = car.ImageUrl,
                    Description = car.Description,
                    CreatedAt = car.CreatedAt,
                    UpdatedAt = car.UpdatedAt,
                    IsActive = car.IsActive,
                    Station = station != null ? new StationInfo
                    {
                        StationName = station.StationName,
                        Address = station.Address,
                        PhoneNumber = station.PhoneNumber,
                        AvailableSlots = station.AvailableSlots,
                        Status = station.Status
                    } : null
                };

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car with station details retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving car with station details: {ex.Message}",
                    Data = null
                };
            }
        }

        private CarResponseDto MapToResponseDto(Car car)
        {
            return new CarResponseDto
            {
                CarId = car.CarId,
                StationId = car.StationId,
                LicensePlate = car.LicensePlate,
                Brand = car.Brand,
                Model = car.Model,
                Year = car.Year,
                Color = car.Color,
                SeatCapacity = car.SeatCapacity,
                BatteryCapacity = car.BatteryCapacity,
                CurrentBatteryLevel = car.CurrentBatteryLevel,
                MaxRange = car.MaxRange,
                ChargerType = car.ChargerType,
                HourlyRate = car.HourlyRate,
                DailyRate = car.DailyRate,
                DepositAmount = car.DepositAmount,
                Status = car.Status,
                ImageUrl = car.ImageUrl,
                Description = car.Description,
                CreatedAt = car.CreatedAt,
                UpdatedAt = car.UpdatedAt,
                IsActive = car.IsActive
            };
        }
    }
}

