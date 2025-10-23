using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Contract;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Yêu cầu xác thực
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;
    
    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    /// <summary>
    /// API MỚI: Tạo hợp đồng tự động từ Booking
    /// </summary>
    [HttpPost("tao-tu-booking/{bookingId}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff},{AppRoles.EVRenter}")]
    public async Task<ActionResult<ResponseDto<ContractResponseDto>>> TaoHopDongTuBooking(Guid bookingId)
    {
        var result = await _contractService.TaoHopDongTuBookingAsync(bookingId);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// API MỚI: Gửi email xác nhận ký hợp đồng (với file DOCX đính kèm)
    /// </summary>
    [HttpPost("gui-email-xac-nhan/{contractId}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<ActionResult<ResponseDto<string>>> GuiEmailXacNhanKy(Guid contractId)
    {
        var result = await _contractService.GuiEmailXacNhanKyAsync(contractId);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// API MỚI: Lấy thông tin hợp đồng để hiển thị trang xác nhận (public - dùng token)
    /// </summary>
    [HttpGet("xem-hop-dong")]
    [AllowAnonymous] // Không cần đăng nhập, dùng token
    public async Task<ActionResult<ResponseDto<HopDongXacNhanDto>>> XemHopDongTheoToken([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(ResponseDto<HopDongXacNhanDto>.Failure("Token không hợp lệ"));
        }

        var result = await _contractService.LayThongTinHopDongTheoTokenAsync(token);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// API MỚI: Xác nhận ký hợp đồng (public - dùng token)
    /// </summary>
    [HttpPost("xac-nhan-ky")]
    [AllowAnonymous] // Không cần đăng nhập, dùng token
    public async Task<ActionResult<ResponseDto<string>>> XacNhanKyHopDong([FromBody] KyHopDongRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(ResponseDto<string>.Failure("Token không hợp lệ"));
        }

        var result = await _contractService.XacNhanKyHopDongAsync(request.Token);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Xóa mềm hợp đồng (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ResponseDto<string>>> XoaHopDong(Guid id)
    {
        var result = await _contractService.XoaMemHopDongAsync(id);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    #region Legacy APIs (Backward compatibility)

    // Endpoint tạo hợp đồng (cũ - giữ lại cho backward compatibility)
    [HttpPost("tao-hop-dong")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<IActionResult> TaoHopDong([FromBody] TaoHopDongDto request)
    {
        var contractId = await _contractService.LuuHopDongVaTaoFileAsync(request);
        return Ok(new { HopDongId = contractId });
    }

    // Endpoint gửi email (cũ)
    [HttpPost("{id}/gui-xac-nhan")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<IActionResult> GuiEmailXacNhan(Guid id, [FromBody] GuiEmailRequestDto request)
    {
        await _contractService.GuiEmailXacNhanAsync(id, request.Email);
        return Ok(new { message = "Email xác nhận đã được gửi đi." });
    }

    // Endpoint cho frontend lấy nội dung hợp đồng (cũ)
    [HttpGet("xac-nhan/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> LayNoiDung(string token)
    {
        try
        {
            var data = await _contractService.LayHopDongDeXacNhanAsync(token);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion
}
