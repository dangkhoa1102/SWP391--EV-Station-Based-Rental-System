using Microsoft.AspNetCore.Mvc;
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
        public async Task<ActionResult<ResponseDto<StationDto>>> UpdateStation(Guid id, [FromBody] UpdateStationDto request)
        {
            var result = await _stationService.UpdateStationAsync(id, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ResponseDto<string>>> DeleteStation(Guid id)
        {
            var result = await _stationService.DeleteStationAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<ResponseDto<List<StationDto>>>> GetNearby([FromQuery] decimal lat, [FromQuery] decimal lng, [FromQuery] double radiusKm = 10)
        {
            var result = await _stationService.GetNearbyStationsAsync(lat, lng, radiusKm);
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


