using HopDong.Application;
using HopDong.Application.Services.IServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HopDong.APIs;

[Route("api/[controller]")]
[ApiController]
public class HopDongController : ControllerBase
{
    private readonly IHopDongFileService _hopDongFileService;

    public HopDongController(IHopDongFileService hopDongFileService)
    {
        _hopDongFileService = hopDongFileService;
    }

    [HttpPost("tao-file-word")]
    public async Task<IActionResult> TaoHopDong([FromBody] TaoHopDongDto request)
    {
        try
        {
            var fileStream = await _hopDongFileService.TaoHopDongFileAsync(request);
            var fileName = $"HopDong_{request.SoHopDong.Replace("/", "-")}.docx";
            var contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            return File(fileStream, contentType, fileName);
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            // Ghi log lỗi ở đây
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
}
