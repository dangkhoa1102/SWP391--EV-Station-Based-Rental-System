using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;

        public CarsController(ICarService carService)
        {
            _carService = carService;
        }

        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<CarDto>>>> GetCars([FromQuery] PaginationRequestDto request)
        {
            var result = await _carService.GetCarsAsync(request);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseDto<CarDto>>> GetCar(Guid id)
        {
            var result = await _carService.GetCarByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<CarDto>>> CreateCar([FromBody] CreateCarDto request)
        {
            var result = await _carService.CreateCarAsync(request);
            return Ok(result);
        }
    }
}