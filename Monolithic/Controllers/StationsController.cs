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
        private readonly IUserService _userService;

        public StationsController(IStationService stationService, IUserService userService)
        {
            _stationService = stationService;
            _userService = userService;
        }

        /// <summary>
        /// Lấy danh sách trạm sạc (có phân trang)
        /// </summary>
        [HttpGet("Get-All")]
        public async Task<ActionResult<ResponseDto<PaginationDto<StationDto>>>> GetStations([FromQuery] PaginationRequestDto request)
        {
            var result = await _stationService.GetStationsAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Xem chi tiết thông tin trạm sạc
        /// </summary>
        [HttpGet("Get-By-{id}")]
        public async Task<ActionResult<ResponseDto<StationDto>>> GetStation(Guid id)
        {
            var result = await _stationService.GetStationByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Tạo trạm sạc mới (Admin, Station Staff)
        /// </summary>
        [HttpPost("Create")]
        //[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ResponseDto<StationDto>>> CreateStation([FromBody] CreateStationDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<StationDto>.Failure("Invalid request"));
            }
            var result = await _stationService.CreateStationAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật thông tin trạm sạc (Admin, Station Staff)
        /// </summary>
        [HttpPut("Update-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<StationDto>>> UpdateStation(Guid id, [FromBody] UpdateStationDto request)
        {
            var result = await _stationService.UpdateStationAsync(id, request);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Xóa trạm sạc (chỉ Admin)
        /// </summary>
        [HttpDelete("Delete-By-{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> DeleteStation(Guid id)
        {
            var result = await _stationService.DeleteStationAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Xem danh sách xe khả dụng tại trạm
        /// </summary>
        [HttpGet("Get-Available-Cars-By-{id}")]
        public async Task<ActionResult<ResponseDto<List<StationCarDto>>>> GetAvailableCars(Guid id)
        {
            var result = await _stationService.GetAvailableCarsAtStationAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật số lượng chỗ đỗ xe
        /// </summary>
        [HttpPatch("Update-Slots-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateSlots(Guid id, [FromQuery] int totalSlots)
        {
            var result = await _stationService.UpdateStationSlotsAsync(id, totalSlots);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Tính toán lại AvailableSlots dựa trên số xe thực tế tại station (Admin/Staff)
        /// </summary>
        [HttpPost("Recalculate-Slots-By-{id}")]
        [Authorize] // Cho phép tất cả user đã đăng nhập (cho mục đích testing)
        public async Task<ActionResult<ResponseDto<string>>> RecalculateSlots(Guid id)
        {
            var result = await _stationService.RecalculateStationAvailableSlotsAsync(id);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Gán nhân viên (Station Staff) vào một trạm
        /// </summary>
        [HttpPost("{stationId}/Assign-Staff")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> AssignStaffToStation(Guid stationId, [FromQuery] string staffId)
        {
            var result = await _userService.AssignStaffToStationAsync(staffId, stationId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Bỏ gán nhân viên khỏi trạm (staff rời trạm)
        /// </summary>
        [HttpPost("Unassign-Staff")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UnassignStaffFromStation([FromQuery] string staffId)
        {
            var result = await _userService.AssignStaffToStationAsync(staffId, null);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Chuyển nhân viên từ trạm này sang trạm khác
        /// </summary>
        [HttpPost("Reassign-Staff")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> ReassignStaff([FromQuery] string staffId, [FromQuery] Guid toStationId)
        {
            var result = await _userService.AssignStaffToStationAsync(staffId, toStationId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}

