namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response
{
    public class LoginResponseDto
    {
        public UserDto User { get; set; }
        public string Token { get; set; }

        public string RefreshToken { get; set; }
        public DateTime TokenExpiry { get; set; }
    }
}
