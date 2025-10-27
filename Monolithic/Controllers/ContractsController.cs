using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Contract;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly IContractFileService _contractFileService;

        public ContractsController(IContractService contractService, IContractFileService contractFileService)
        {
            _contractService = contractService;
            _contractFileService = contractFileService;
        }

        /// <summary>
        /// Tạo hợp đồng mới
        /// </summary>
        [HttpPost("Create")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> CreateContract([FromBody] CreateContractDto request)
        {
            var result = await _contractService.CreateContractAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Điền thông tin hợp đồng
        /// </summary>
        [HttpPost("Fill")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> FillContract([FromBody] Monolithic.DTOs.Contract.FillContractFieldsDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ResponseDto<ContractDto>.Failure("Validation failed"));

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ResponseDto<ContractDto>.Failure("Unauthorized"));
            }

            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Customer";
            var result = await _contractService.FillContractAsync(request, userId, role);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Yêu cầu xác nhận hợp đồng qua email
        /// </summary>
        [HttpPost("Request-Confirmation-By-{contractId}")]
        public async Task<ActionResult<ResponseDto<string>>> RequestConfirmation(Guid contractId, [FromBody] RequestConfirmationDto body)
        {
            var result = await _contractService.RequestConfirmationAsync(contractId, body.Email);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Xác nhận hợp đồng với token
        /// </summary>
        [HttpPost("Confirm")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> Confirm([FromBody] ConfirmContractDto body)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
            var ua = Request.Headers["User-Agent"].ToString();
            var result = await _contractService.ConfirmContractAsync(body.ContractId, body.Token, ip, ua);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// Lấy hợp đồng theo booking ID
        /// </summary>
        [HttpGet("Get-By-Booking/{bookingId}")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> GetByBooking(Guid bookingId)
        {
            var result = await _contractService.GetContractByBookingIdAsync(bookingId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách hợp đồng của người thuê
        /// </summary>
        [HttpGet("Get-By-Renter/{renterId}")]
        public async Task<ActionResult<ResponseDto<List<ContractDto>>>> GetByRenter(Guid renterId)
        {
            var result = await _contractService.GetContractsByRenterAsync(renterId);
            return Ok(result);
        }

        /// <summary>
        /// Tạo file Word hợp đồng từ thông tin động
        /// </summary>
        [HttpPost("tao-file-word")]
        public async Task<IActionResult> TaoHopDong([FromBody] TaoHopDongDto request)
        {
            try
            {
                var fileStream = await _contractFileService.TaoHopDongFileAsync(request);
                var fileName = $"HopDong_{request.SoHopDong.Replace("/", "-")}.docx";
                var contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

                return File(fileStream, contentType, fileName);
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        /// <summary>
        /// Tạo file Word hợp đồng với liên kết bookingId
        /// </summary>
        [HttpPost("tao-file-word/booking/{bookingId}")]
        public async Task<IActionResult> TaoHopDongWithBooking(Guid bookingId, [FromBody] TaoHopDongDto request)
        {
            try
            {
                var fileStream = await _contractFileService.TaoHopDongFileWithBookingAsync(bookingId, request);
                var fileName = $"HopDong_{request.SoHopDong.Replace("/", "-")}.docx";
                var contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

                return File(fileStream, contentType, fileName);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi hệ thống: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy thông tin hợp đồng theo bookingId (File Service)
        /// </summary>
        [HttpGet("file-service/booking/{bookingId}")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> GetContractFileServiceByBooking(Guid bookingId)
        {
            try
            {
                var contract = await _contractFileService.GetContractByBookingIdAsync(bookingId);
                return Ok(ResponseDto<ContractDto>.Success(contract));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ResponseDto<ContractDto>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<ContractDto>.Failure($"Lỗi hệ thống: {ex.Message}"));
            }
        }

        /// <summary>
        /// Cập nhật hợp đồng theo bookingId
        /// </summary>
        [HttpPut("update/booking/{bookingId}")]
        public async Task<ActionResult<ResponseDto<bool>>> UpdateContractByBooking(Guid bookingId, [FromBody] TaoHopDongDto request)
        {
            try
            {
                var result = await _contractFileService.UpdateContractByBookingIdAsync(bookingId, request);
                return Ok(ResponseDto<bool>.Success(result));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ResponseDto<bool>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<bool>.Failure($"Lỗi hệ thống: {ex.Message}"));
            }
        }

        /// <summary>
        /// Xóa hợp đồng theo bookingId
        /// </summary>
        [HttpDelete("delete/booking/{bookingId}")]
        public async Task<ActionResult<ResponseDto<bool>>> DeleteContractByBooking(Guid bookingId)
        {
            try
            {
                var result = await _contractFileService.DeleteContractByBookingIdAsync(bookingId);
                return Ok(ResponseDto<bool>.Success(result));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ResponseDto<bool>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<bool>.Failure($"Lỗi hệ thống: {ex.Message}"));
            }
        }
    }
}
