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
    }
}
