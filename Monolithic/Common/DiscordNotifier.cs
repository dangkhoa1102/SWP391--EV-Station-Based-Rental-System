using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Monolithic.Common;

public interface IDiscordNotifier
{
    Task SendMessageAsync(string message);
}
public class DiscordNotifier : IDiscordNotifier
{
    private readonly string _webhookUrl;
    private readonly HttpClient _httpClient;

    public DiscordNotifier(IConfiguration configuration)
    {
        // Lấy từ biến môi trường, ưu tiên nếu bạn đã load .env vào env vars
        _webhookUrl = Environment.GetEnvironmentVariable("WEBHOOK_URL");

        if (string.IsNullOrEmpty(_webhookUrl))
        {
            throw new ArgumentNullException("WEBHOOK_URL", "Discord webhook URL is not configured.");
        }

        _httpClient = new HttpClient();
    }

    public DiscordNotifier(string webhookUrl)
    {
        _webhookUrl = webhookUrl;
        _httpClient = new HttpClient();
    }

    public async Task SendMessageAsync(string message)
    {
        var payload = new { content = message };
        var json = JsonSerializer.Serialize(payload);
        var data = new StringContent(json, Encoding.UTF8, "application/json");

        await _httpClient.PostAsync(_webhookUrl, data);
    }
}
