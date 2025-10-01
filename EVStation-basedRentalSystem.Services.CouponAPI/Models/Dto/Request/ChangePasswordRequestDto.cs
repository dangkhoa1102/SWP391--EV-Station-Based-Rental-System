namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request
{
    public class ChangePasswordRequestDto
    {
        public string UserId { get; set; } = null!;
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
