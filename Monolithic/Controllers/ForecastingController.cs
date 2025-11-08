using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Models;
using System.Text.Json;

namespace Monolithic.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ForecastingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _aiApiUrl = "http://127.0.0.1:8000"; // Địa chỉ API Python

    // 1. "Tiêm" IHttpClientFactory vào constructor
    public ForecastingController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    // 2. Tạo một endpoint GET, ví dụ: /api/forecasting/demand?days=30
    [HttpGet("demand")]
    public async Task<IActionResult> GetDemandForecast([FromQuery] int days = 30)
    {
        if (days <= 0 || days > 365)
        {
            return BadRequest("Số ngày dự báo phải từ 1 đến 365.");
        }

        try
        {
            // 3. Tạo một HttpClient từ Factory
            var client = _httpClientFactory.CreateClient();

            string requestUrl = $"{_aiApiUrl}/predict?days_to_forecast={days}";

            // 4. Gọi API Python
            var response = await client.GetAsync(requestUrl);

            if (response.IsSuccessStatusCode)
            {
                // 5. Đọc nội dung JSON trả về
                var jsonString = await response.Content.ReadAsStringAsync();

                // 6. Chuyển đổi (Deserialize) JSON thành danh sách C#
                // Chúng ta cần JsonSerializerOptions vì tên thuộc tính là case-sensitive
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var forecastResults = JsonSerializer.Deserialize<List<ForecastDto>>(jsonString, options);

                // 7. Trả kết quả về cho front-end
                return Ok(forecastResults);
            }
            else
            {
                // Nếu API Python bị lỗi (ví dụ: server sập)
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Lỗi khi gọi AI API: {errorContent}");
            }
        }
        catch (HttpRequestException ex)
        {
            // Lỗi nếu không thể kết nối tới API Python (ví dụ: bạn chưa chạy 'uvicorn 2_api:app')
            return StatusCode(503, $"Không thể kết nối tới dịch vụ AI. {ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi máy chủ nội bộ: {ex.Message}");
        }
    }
}
