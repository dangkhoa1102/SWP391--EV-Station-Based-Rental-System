using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Clients
{
    public class UserServiceClient
    {
        private readonly HttpClient _httpClient;

        public UserServiceClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task CreateUserAsync(UserDto user)
        {
            await _httpClient.PostAsJsonAsync("api/users/sync", user);
        }
    }
}
