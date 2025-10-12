namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request
{
    public class AssignRoleRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
