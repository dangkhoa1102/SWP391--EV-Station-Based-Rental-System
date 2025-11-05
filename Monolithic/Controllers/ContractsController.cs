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

        public ContractsController(IContractService contractService)
        {
            _contractService = contractService;
        }

        ///// <summary>
        ///// Tạo hợp đồng mới
        ///// </summary>
        //[HttpPost("Create")]
        //public async Task<ActionResult<ResponseDto<ContractDto>>> CreateContract([FromBody] CreateContractDto request)
        //{
        //    var result = await _contractService.CreateContractAsync(request);
        //    if (!result.IsSuccess) return BadRequest(result);
        //    return Ok(result);
        //}

        ///// <summary>
        ///// Điền thông tin hợp đồng
        ///// </summary>
        //[HttpPost("Fill")]
        //public async Task<ActionResult<ResponseDto<ContractDto>>> FillContract([FromBody] Monolithic.DTOs.Contract.FillContractFieldsDto request)
        //{
        //    if (!ModelState.IsValid) return BadRequest(ResponseDto<ContractDto>.Failure("Validation failed"));

        //    var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        //    if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        //    {
        //        return Unauthorized(ResponseDto<ContractDto>.Failure("Unauthorized"));
        //    }

        //    var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Customer";
        //    var result = await _contractService.FillContractAsync(request, userId, role);
        //    if (!result.IsSuccess) return BadRequest(result);
        //    return Ok(result);
        //}

        ///// <summary>
        ///// Yêu cầu xác nhận hợp đồng qua email
        ///// </summary>
        //[HttpPost("Request-Confirmation-By-{contractId}")]
        //public async Task<ActionResult<ResponseDto<string>>> RequestConfirmation(Guid contractId, [FromBody] RequestConfirmationDto body)
        //{
        //    var result = await _contractService.RequestConfirmationAsync(contractId, body.Email);
        //    if (!result.IsSuccess) return BadRequest(result);
        //    return Ok(result);
        //}

        ///// <summary>
        ///// Xác nhận hợp đồng với token
        ///// </summary>
        //[HttpPost("Confirm")]
        //public async Task<ActionResult<ResponseDto<ContractDto>>> Confirm([FromBody] ConfirmContractDto body)
        //{
        //    var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
        //    var ua = Request.Headers["User-Agent"].ToString();
        //    var result = await _contractService.ConfirmContractAsync(body.ContractId, body.Token, ip, ua);
        //    if (!result.IsSuccess) return BadRequest(result);
        //    return Ok(result);
        //}

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

        // --- HopDong Specific Endpoints ---

        /// <summary>
        /// Lưu hợp đồng thuê xe và tạo file Word từ template (TỰ ĐỘNG lấy dữ liệu từ User/Booking/Car)
        /// </summary>
        /// <remarks>
        /// Body (TaoHopDongDto) là OPTIONAL - nếu không gửi body, hệ thống sẽ tự động lấy dữ liệu từ:
        /// - User (tên, năm sinh, CCCD, địa chỉ, GPLX)
        /// - Booking (thời gian thuê, giá thuê)
        /// - Car (thông tin xe)
        /// 
        /// Nếu muốn override một số trường, gửi body với các trường cần thay đổi.
        /// </remarks>
        [HttpPost("hopdong/tao")]
        public async Task<ActionResult<ResponseDto<Guid>>> TaoHopDong(
            [FromQuery] Guid bookingId, 
            [FromQuery] Guid renterId,
            [FromBody] TaoHopDongDto? request = null)
        {
            try
            {
                var contractId = await _contractService.LuuHopDongVaTaoFileAsync(request, bookingId, renterId);
                return Ok(ResponseDto<Guid>.Success(contractId, "The contract has been created successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<Guid>.Failure($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Gửi email xác nhận hợp đồng
        /// </summary>
        [HttpPost("hopdong/{contractId}/gui-email")]
        public async Task<ActionResult<ResponseDto<string>>> GuiEmailXacNhan(Guid contractId, [FromBody] GuiEmailRequestDto body)
        {
            try
            {
                await _contractService.GuiEmailXacNhanAsync(contractId, body.Email);
                return Ok(ResponseDto<string>.Success("", "Email xác nhận đã được gửi"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy hợp đồng để xác nhận (chuyển sang HTML)
        /// </summary>
        [HttpGet("hopdong/xac-nhan/{token}")]
        public async Task<ActionResult<ResponseDto<HopDongXacNhanDto>>> LayHopDongDeXacNhan(string token)
        {
            try
            {
                var result = await _contractService.LayHopDongDeXacNhanAsync(token);
                return Ok(ResponseDto<HopDongXacNhanDto>.Success(result, "Hợp đồng lấy thành công"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<HopDongXacNhanDto>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<HopDongXacNhanDto>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Xác nhận và ký hợp đồng
        /// </summary>
        [HttpPost("hopdong/ky")]
        public async Task<ActionResult<ResponseDto<string>>> XacNhanKyHopDong([FromBody] KyHopDongRequestDto body)
        {
            try
            {
                await _contractService.XacNhanKyHopDongAsync(body.Token);
                return Ok(ResponseDto<string>.Success("", "Hợp đồng đã được ký thành công"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Xóa mềm hợp đồng
        /// </summary>
        [HttpDelete("hopdong/{contractId}")]
        public async Task<ActionResult<ResponseDto<string>>> XoaMemHopDong(Guid contractId)
        {
            try
            {
                await _contractService.XoaMemHopDongAsync(contractId);
                return Ok(ResponseDto<string>.Success("", "Hợp đồng đã được xóa"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Download file hợp đồng DOCX bằng token (dùng cho link trong email)
        /// </summary>
        [HttpGet("hopdong/download/{token}")]
        public async Task<IActionResult> DownloadHopDongByToken(string token)
        {
            try
            {
                var (fileBytes, fileName) = await _contractService.DownloadHopDongFileByTokenAsync(token);
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Download file hợp đồng DOCX theo ContractId (yêu cầu authentication)
        /// </summary>
        [HttpGet("{contractId}/download")]
        public async Task<IActionResult> DownloadHopDongByContractId(Guid contractId)
        {
            try
            {
                // Lấy userId từ claims nếu user đã đăng nhập
                Guid? currentUserId = null;
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
                {
                    currentUserId = userId;
                }

                // Lấy role
                var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                var (fileBytes, fileName) = await _contractService.DownloadHopDongFileByContractIdAsync(contractId, currentUserId, role);
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ResponseDto<string>.Failure(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Download hợp đồng mới nhất của user (yêu cầu authentication)
        /// </summary>
        //[HttpGet("user/{userId}/download-latest")]
        [HttpGet("user/download-latest-by-userId")]
        public async Task<IActionResult> DownloadLatestContractByUserId(Guid userId)
        {
            try
            {
                // Lấy userId từ claims
                Guid? currentUserId = null;
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var currentUser))
                {
                    currentUserId = currentUser;
                }

                var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                var (fileBytes, fileName) = await _contractService.DownloadLatestContractByUserIdAsync(userId, currentUserId, role);
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ResponseDto<string>.Failure(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<string>.Failure(ex.Message));
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ResponseDto<string>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy hợp đồng theo token xác nhận
        /// </summary>
        [HttpGet("hopdong/token/{token}")]
        public async Task<ActionResult<ResponseDto<ContractDto>>> GetByToken(string token)
        {
            try
            {
                var result = await _contractService.GetContractByTokenAsync(token);
                return Ok(ResponseDto<ContractDto>.Success(result, "Hợp đồng lấy thành công"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseDto<ContractDto>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseDto<ContractDto>.Failure($"Lỗi: {ex.Message}"));
            }
        }
    }
}
