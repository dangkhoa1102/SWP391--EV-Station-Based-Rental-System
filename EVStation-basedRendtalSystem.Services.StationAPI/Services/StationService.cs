using EVStation_basedRendtalSystem.Services.StationAPI.DTOs;
using EVStation_basedRendtalSystem.Services.StationAPI.Models;
using EVStation_basedRendtalSystem.Services.StationAPI.Repository.IRepository;
using EVStation_basedRendtalSystem.Services.StationAPI.Services.IService;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Services
{
    public class StationService : IStationService
    {
        private readonly IStationRepository _stationRepository;

        public StationService(IStationRepository stationRepository)
        {
            _stationRepository = stationRepository;
        }

        public async Task<ApiResponseDto> CreateStationAsync(CreateStationRequestDto request)
        {
            try
            {
                // Check if station with same name already exists
                var existingStation = await _stationRepository.GetByNameAsync(request.StationName);
                if (existingStation != null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Station with this name already exists.",
                        Data = null
                    };
                }

                var station = new Station
                {
                    StationName = request.StationName,
                    Address = request.Address,
                    PhoneNumber = request.PhoneNumber,
                    TotalParkingSlots = request.TotalParkingSlots,
                    AvailableSlots = request.AvailableSlots,
                    Status = request.Status,
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var createdStation = await _stationRepository.CreateAsync(station);
                var response = MapToResponseDto(createdStation);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Station created successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error creating station: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetStationByIdAsync(int stationId)
        {
            try
            {
                var station = await _stationRepository.GetByIdAsync(stationId);
                if (station == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Station not found",
                        Data = null
                    };
                }

                var response = MapToResponseDto(station);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Station retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving station: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetAllStationsAsync()
        {
            try
            {
                var stations = await _stationRepository.GetAllAsync();
                var response = stations.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Stations retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving stations: {ex.Message}",
                    Data = null
                };
            }
        }


        public async Task<ApiResponseDto> GetStationsByStatusAsync(string status)
        {
            try
            {
                var stations = await _stationRepository.GetByStatusAsync(status);
                var response = stations.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Stations retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving stations: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateStationAsync(int stationId, UpdateStationRequestDto request)
        {
            try
            {
                var station = await _stationRepository.GetByIdAsync(stationId);
                if (station == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Station not found",
                        Data = null
                    };
                }

                // Check if another station with same name exists
                var existingStation = await _stationRepository.GetByNameAsync(request.StationName);
                if (existingStation != null && existingStation.StationId != stationId)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Another station with this name already exists.",
                        Data = null
                    };
                }

                station.StationName = request.StationName;
                station.Address = request.Address;
                station.PhoneNumber = request.PhoneNumber;
                station.TotalParkingSlots = request.TotalParkingSlots;
                station.AvailableSlots = request.AvailableSlots;
                station.Status = request.Status;
                station.Description = request.Description;

                var updatedStation = await _stationRepository.UpdateAsync(station);
                var response = MapToResponseDto(updatedStation);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Station updated successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating station: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> DeleteStationAsync(int stationId)
        {
            try
            {
                var result = await _stationRepository.DeleteAsync(stationId);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Station not found",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Station deleted successfully",
                    Data = null
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error deleting station: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetStationsWithAvailableSlotsAsync()
        {
            try
            {
                var stations = await _stationRepository.GetStationsWithAvailableSlotsAsync();
                var response = stations.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Stations with available slots retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving stations: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> SearchStationsAsync(string searchTerm)
        {
            try
            {
                var stations = await _stationRepository.SearchStationsAsync(searchTerm);
                var response = stations.Select(MapToResponseDto).ToList();

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
                    Message = $"Error searching stations: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateAvailableSlotsAsync(int stationId, int availableSlots)
        {
            try
            {
                var station = await _stationRepository.GetByIdAsync(stationId);
                if (station == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Station not found",
                        Data = null
                    };
                }

                if (availableSlots > station.TotalParkingSlots)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Available slots cannot exceed total parking slots",
                        Data = null
                    };
                }

                var result = await _stationRepository.UpdateAvailableSlotsAsync(stationId, availableSlots);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Failed to update available slots",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Available slots updated successfully",
                    Data = new { StationId = stationId, AvailableSlots = availableSlots }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating available slots: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetStationStatisticsAsync()
        {
            try
            {
                var totalStations = await _stationRepository.GetTotalStationsCountAsync();
                var activeStations = await _stationRepository.GetActiveStationsCountAsync();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Statistics retrieved successfully",
                    Data = new
                    {
                        TotalStations = totalStations,
                        ActiveStations = activeStations,
                        InactiveStations = totalStations - activeStations
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

        private StationResponseDto MapToResponseDto(Station station)
        {
            return new StationResponseDto
            {
                StationId = station.StationId,
                StationName = station.StationName,
                Address = station.Address,
                PhoneNumber = station.PhoneNumber,
                TotalParkingSlots = station.TotalParkingSlots,
                AvailableSlots = station.AvailableSlots,
                Status = station.Status,
                Description = station.Description,
                CreatedAt = station.CreatedAt,
                UpdatedAt = station.UpdatedAt,
                IsActive = station.IsActive
            };
        }
    }
}

