using EVStation_basedRentalSystem.Services.CarAPI.DTOs;
using EVStation_basedRentalSystem.Services.CarAPI.Services.IService;
using Microsoft.AspNetCore.Mvc;

namespace EVStation_basedRentalSystem.Services.CarAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CarController : ControllerBase
    {
        private readonly ICarService _carService;

        public CarController(ICarService carService)
        {
            _carService = carService;
        }

        /// <summary>
        /// Create a new car
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCar([FromBody] CreateCarRequestDto request)
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

            var result = await _carService.CreateCarAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get car by ID
        /// </summary>
        [HttpGet("{carId}")]
        public async Task<IActionResult> GetCarById(int carId)
        {
            var result = await _carService.GetCarByIdAsync(carId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all cars
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllCars()
        {
            var result = await _carService.GetAllCarsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get cars by station ID
        /// </summary>
        [HttpGet("station/{stationId}")]
        public async Task<IActionResult> GetCarsByStationId(int stationId)
        {
            var result = await _carService.GetCarsByStationIdAsync(stationId);
            return Ok(result);
        }

        /// <summary>
        /// Get cars by status
        /// </summary>
        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetCarsByStatus(string status)
        {
            var result = await _carService.GetCarsByStatusAsync(status);
            return Ok(result);
        }

        /// <summary>
        /// Get available cars
        /// </summary>
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableCars()
        {
            var result = await _carService.GetAvailableCarsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get cars by brand
        /// </summary>
        [HttpGet("brand/{brand}")]
        public async Task<IActionResult> GetCarsByBrand(string brand)
        {
            var result = await _carService.GetCarsByBrandAsync(brand);
            return Ok(result);
        }

        /// <summary>
        /// Get cars by price range
        /// </summary>
        [HttpGet("price-range")]
        public async Task<IActionResult> GetCarsByPriceRange([FromQuery] decimal minPrice, [FromQuery] decimal maxPrice)
        {
            var result = await _carService.GetCarsByPriceRangeAsync(minPrice, maxPrice);
            return Ok(result);
        }

        /// <summary>
        /// Search cars by brand, model, or license plate
        /// </summary>
        [HttpGet("search/{searchTerm}")]
        public async Task<IActionResult> SearchCars(string searchTerm)
        {
            var result = await _carService.SearchCarsAsync(searchTerm);
            return Ok(result);
        }

        /// <summary>
        /// Update car (partial update supported - only provided fields will be updated)
        /// </summary>
        [HttpPut("{carId}")]
        public async Task<IActionResult> UpdateCar(int carId, [FromBody] UpdateCarRequestDto request)
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

            var result = await _carService.UpdateCarAsync(carId, request);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Delete car (soft delete)
        /// </summary>
        [HttpDelete("{carId}")]
        public async Task<IActionResult> DeleteCar(int carId)
        {
            var result = await _carService.DeleteCarAsync(carId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Update battery level for a car
        /// </summary>
        [HttpPatch("{carId}/battery/{batteryLevel}")]
        public async Task<IActionResult> UpdateBatteryLevel(int carId, decimal batteryLevel)
        {
            var result = await _carService.UpdateBatteryLevelAsync(carId, batteryLevel);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Update status for a car
        /// </summary>
        [HttpPatch("{carId}/status/{status}")]
        public async Task<IActionResult> UpdateStatus(int carId, string status)
        {
            var result = await _carService.UpdateStatusAsync(carId, status);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get car statistics
        /// </summary>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetCarStatistics()
        {
            var result = await _carService.GetCarStatisticsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get car with station details (inter-service communication)
        /// </summary>
        [HttpGet("{carId}/with-station")]
        public async Task<IActionResult> GetCarWithStationDetails(int carId)
        {
            var result = await _carService.GetCarWithStationDetailsAsync(carId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }
    }
}
