using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Common;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        public CarsController()
        {
        }

        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<CarDto>>>> GetCars([FromQuery] PaginationRequestDto request)
        {
            // TODO: Implement get cars logic
            var emptyPagination = new PaginationDto<CarDto>(new List<CarDto>(), request.Page, request.PageSize, 0);
            return Ok(ResponseDto<PaginationDto<CarDto>>.Success(emptyPagination, "Cars retrieved successfully (implementation pending)"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseDto<CarDto>>> GetCar(Guid id)
        {
            // TODO: Implement get car by id logic
            return Ok(ResponseDto<CarDto>.Failure("Not implemented yet"));
        }

        [HttpPost]
        public async Task<ActionResult<ResponseDto<CarDto>>> CreateCar([FromBody] CreateCarDto request)
        {
            // TODO: Implement create car logic
            return Ok(ResponseDto<CarDto>.Failure("Not implemented yet"));
        }
    }
}