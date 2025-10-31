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

        /// <summary>
        /// Lấy danh sách xe (có phân trang và tìm kiếm)
        /// </summary>
        [HttpGet("Get-All")]
        public async Task<ActionResult<ResponseDto<PaginationDto<CarDto>>>> GetCars([FromQuery] PaginationRequestDto request)
        {
            var result = await _carService.GetCarsAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Xem chi tiết thông tin xe theo ID
        /// </summary>
        [HttpGet("Get-By-{id}")]
        public async Task<ActionResult<ResponseDto<CarDto>>> GetCar(Guid id)
        {
            var result = await _carService.GetCarByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách xe khả dụng tại trạm
        /// </summary>
        [HttpGet("Get-Available-By-Station/{stationId}")]
        public async Task<ActionResult<ResponseDto<List<CarDto>>>> GetAvailableCars(Guid stationId)
        {
            var result = await _carService.GetAvailableCarsAsync(stationId);
            return Ok(result);
        }

        /// <summary>
        /// Tìm kiếm xe khả dụng với bộ lọc (cho EV Renter) - Brand, model, giá, pin, trạm
        /// </summary>
        [HttpGet("Search-Available")]
        public async Task<ActionResult<ResponseDto<List<CarDto>>>> SearchAvailableCars(
            [FromQuery] Guid? stationId = null,
            [FromQuery] string? brand = null,
            [FromQuery] string? model = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] decimal? minBatteryLevel = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _carService.SearchAvailableCarsAsync(
                    stationId, brand, model, minPrice, maxPrice, minBatteryLevel, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<List<CarDto>>.Failure($"Lỗi tìm kiếm: {ex.Message}"));
            }
        }

        /// <summary>
        /// Tạo xe mới (Admin, Station Staff) - hỗ trợ upload ảnh
        /// </summary>
        [HttpPost("Create")]
        //[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ResponseDto<CarDto>>> CreateCar([FromForm] CreateCarDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<CarDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _carService.CreateCarAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetCar), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Cập nhật thông tin xe (Admin, Station Staff)
        /// </summary>
        [HttpPut("Update-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<CarDto>>> UpdateCar(Guid id, [FromBody] UpdateCarDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<CarDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _carService.UpdateCarAsync(id, request);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Xóa xe (soft delete - chuyển IsActive = false) (chỉ Admin)
        /// </summary>
        [HttpDelete("Delete-By-{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> DeleteCar(Guid id)
        {
            var result = await _carService.DeleteCarAsync(id);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật trạng thái khả dụng của xe (Admin, Station Staff)
        /// </summary>
        [HttpPatch("Update-Status-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateCarStatus(Guid id, [FromQuery] bool isAvailable)
        {
            var result = await _carService.UpdateCarStatusAsync(id, isAvailable);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật mức pin hiện tại của xe (Admin, Station Staff)
        /// </summary>
        [HttpPatch("Update-Battery-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateCarBatteryLevel(Guid id, [FromQuery] decimal batteryLevel)
        {
            if (batteryLevel < 0 || batteryLevel > 100)
            {
                return BadRequest(ResponseDto<string>.Failure("Mức pin phải trong khoảng 0-100"));
            }

            var result = await _carService.UpdateCarBatteryLevelAsync(id, batteryLevel);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật vị trí xe (chuyển trạm) (Admin, Station Staff)
        /// </summary>
        [HttpPatch("Update-Location-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateCarLocation(Guid id, [FromQuery] Guid stationId)
        {
            var result = await _carService.UpdateCarLocationAsync(id, stationId);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật tình trạng kỹ thuật của xe (Station Staff, Admin)
        /// </summary>
        [HttpPut("Update-Technical-Status-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<string>>> UpdateCarTechnicalStatus(Guid id, [FromBody] UpdateCarTechnicalStatusDto request)
        {
            var result = await _carService.UpdateCarTechnicalStatusAsync(id, request);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Bàn giao xe với chụp ảnh (Station Staff)
        /// </summary>
        [HttpPost("Handover")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ResponseDto<CarHandoverResponseDto>>> RecordCarHandover([FromForm] CarHandoverDto request)
        {
            // Lấy StaffId từ JWT token
            var staffIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffId))
            {
                return Unauthorized(ResponseDto<CarHandoverResponseDto>.Failure("Unauthorized"));
            }

            var result = await _carService.RecordCarHandoverAsync(request, staffId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
