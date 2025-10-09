using EVStation_basedRendtalSystem.Services.StationAPI.DTOs;
using EVStation_basedRendtalSystem.Services.StationAPI.Services.IService;
using Microsoft.AspNetCore.Mvc;

namespace EVStation_basedRendtalSystem.Services.StationAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationController : ControllerBase
    {
        private readonly IStationService _stationService;

        public StationController(IStationService stationService)
        {
            _stationService = stationService;
        }

        /// <summary>
        /// Create a new station
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateStation([FromBody] CreateStationRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "Invalid request data",
                    Data = ModelState
                });
            }

            var result = await _stationService.CreateStationAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get station by ID
        /// </summary>
        [HttpGet("{stationId}")]
        public async Task<IActionResult> GetStationById(int stationId)
        {
            var result = await _stationService.GetStationByIdAsync(stationId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all stations
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllStations()
        {
            var result = await _stationService.GetAllStationsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get stations by status
        /// </summary>
        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetStationsByStatus(string status)
        {
            var result = await _stationService.GetStationsByStatusAsync(status);
            return Ok(result);
        }

        /// <summary>
        /// Update station
        /// </summary>
        [HttpPut("{stationId}")]
        public async Task<IActionResult> UpdateStation(int stationId, [FromBody] UpdateStationRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "Invalid request data",
                    Data = ModelState
                });
            }

            var result = await _stationService.UpdateStationAsync(stationId, request);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Delete station (soft delete)
        /// </summary>
        [HttpDelete("{stationId}")]
        public async Task<IActionResult> DeleteStation(int stationId)
        {
            var result = await _stationService.DeleteStationAsync(stationId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get stations with available slots
        /// </summary>
        [HttpGet("available-slots")]
        public async Task<IActionResult> GetStationsWithAvailableSlots()
        {
            var result = await _stationService.GetStationsWithAvailableSlotsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Search stations by name or address
        /// </summary>
        [HttpGet("search/{searchTerm}")]
        public async Task<IActionResult> SearchStations(string searchTerm)
        {
            var result = await _stationService.SearchStationsAsync(searchTerm);
            return Ok(result);
        }

        /// <summary>
        /// Update available slots for a station
        /// </summary>
        [HttpPatch("{stationId}/available-slots/{availableSlots}")]
        public async Task<IActionResult> UpdateAvailableSlots(int stationId, int availableSlots)
        {
            if (availableSlots < 0)
            {
                return BadRequest(new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "Available slots cannot be negative",
                    Data = null
                });
            }

            var result = await _stationService.UpdateAvailableSlotsAsync(stationId, availableSlots);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get station statistics
        /// </summary>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStationStatistics()
        {
            var result = await _stationService.GetStationStatisticsAsync();
            return Ok(result);
        }
    }
}

