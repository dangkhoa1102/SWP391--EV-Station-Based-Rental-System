namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request
{
    public class ResetPasswordRequestDto
    {
       
            public string Email { get; set; } = null!;
           
            public string NewPassword { get; set; } = null!;
        
    }
}
