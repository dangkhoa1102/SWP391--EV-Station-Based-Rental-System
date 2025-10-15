using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Contract;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;
    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    // Endpoint tạo hợp đồng (đã sửa)
    [HttpPost("tao-hop-dong")]
    public async Task<IActionResult> TaoHopDong([FromBody] TaoHopDongDto request)
    {
        var contractId = await _contractService.LuuHopDongVaTaoFileAsync(request);
        return Ok(new { HopDongId = contractId });
    }

    // Endpoint gửi email
    [HttpPost("{id}/gui-xac-nhan")]
    public async Task<IActionResult> GuiEmailXacNhan(Guid id, [FromBody] GuiEmailRequestDto request)
    {
        await _contractService.GuiEmailXacNhanAsync(id, request.Email);
        return Ok(new { message = "Email xác nhận đã được gửi đi." });
    }

    // Endpoint cho frontend lấy nội dung hợp đồng
    [HttpGet("xac-nhan/{token}")]
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

    // Endpoint để xác nhận ký
    [HttpPost("xac-nhan")]
    public async Task<IActionResult> XacNhanKy([FromBody] KyHopDongRequestDto request)
    {
        try
        {
            await _contractService.XacNhanKyHopDongAsync(request.Token);
            return Ok(new { message = "Hợp đồng đã được ký thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> XoaHopDong(Guid id)
    {
        try
        {
            await _contractService.XoaMemHopDongAsync(id);
            return Ok(new { message = "Hợp đồng đã được xóa mềm thành công." });
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
