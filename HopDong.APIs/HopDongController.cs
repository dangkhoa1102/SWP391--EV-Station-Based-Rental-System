using HopDong.Application;
using HopDong.Application.Services.IServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HopDong.APIs;

[Route("api/[controller]")]
[ApiController]
public class HopDongController : ControllerBase
{
    //private readonly IHopDongFileService _hopDongFileService;
    private readonly IHopDongService _hopDongService;

    public HopDongController(IHopDongService hopDongService)
    {
        _hopDongService = hopDongService;
    }

    // Endpoint tạo hợp đồng (đã sửa)
    [HttpPost("tao-hop-dong")]
    public async Task<IActionResult> TaoHopDong([FromBody] TaoHopDongDto request)
    {
        var hopDongId = await _hopDongService.LuuHopDongVaTaoFileAsync(request);
        return Ok(new { HopDongId = hopDongId });
    }

    // Endpoint gửi email
    [HttpPost("{id}/gui-xac-nhan")]
    public async Task<IActionResult> GuiEmailXacNhan(Guid id, [FromBody] GuiEmailRequestDto request)
    {
        await _hopDongService.GuiEmailXacNhanAsync(id, request.Email);
        return Ok(new { message = "Email xác nhận đã được gửi đi." });
    }

    // Endpoint cho frontend lấy nội dung hợp đồng
    [HttpGet("xac-nhan/{token}")]
    public async Task<IActionResult> LayNoiDung(string token)
    {
        try
        {
            var data = await _hopDongService.LayHopDongDeXacNhanAsync(token);
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
            await _hopDongService.XacNhanKyHopDongAsync(request.Token);
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
            await _hopDongService.XoaMemHopDongAsync(id);
            return Ok(new { message = "Hợp đồng đã được xóa mềm thành công." });
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
