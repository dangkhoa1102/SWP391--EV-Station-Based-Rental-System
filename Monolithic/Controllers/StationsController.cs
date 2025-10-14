using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Station;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationsController : ControllerBase
    {
        private readonly IStationService _stationService;

        public StationsController(IStationService stationService)
        {
            _stationService = stationService;
        }

        [HttpGet]
        public async Task<ActionResult<ResponseDto<PaginationDto<StationDto>>>> GetStations([FromQuery] PaginationRequestDto request)
        {
            var result = await _stationService.GetStationsAsync(request);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseDto<StationDto>>> GetStation(Guid id)
        {
            var result = await _stationService.GetStationByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<StationDto>>> CreateStation([FromBody] CreateStationDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<StationDto>.Failure("Invalid request"));
            }
            var result = await _stationService.CreateStationAsync(request);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<StationDto>>> UpdateStation(Guid id, [FromBody] UpdateStationDto request)
        {
            var result = await _stationService.UpdateStationAsync(id, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> DeleteStation(Guid id)
        {
            var result = await _stationService.DeleteStationAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
        [HttpGet("{id}/cars")]
        public async Task<ActionResult<ResponseDto<List<StationCarDto>>>> GetAvailableCars(Guid id)
        {
            var result = await _stationService.GetAvailableCarsAtStationAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPatch("{id}/slots")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateSlots(Guid id, [FromQuery] int totalSlots)
        {
            var result = await _stationService.UpdateStationSlotsAsync(id, totalSlots);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}


