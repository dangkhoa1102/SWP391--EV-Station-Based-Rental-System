using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.UserAPI.Clients
{
    public class AuthServiceClient
    {
        private readonly HttpClient _httpClient;

        public AuthServiceClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            var response = await _httpClient.GetAsync($"https://authservice/api/validate?token={token}");
            return response.IsSuccessStatusCode;
        }
    }
}
