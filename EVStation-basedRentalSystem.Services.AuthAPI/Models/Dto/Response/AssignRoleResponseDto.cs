namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response
{
    public class AssignRoleResponseDto
    {
        public string UserId { get; set; }
        public string AssignedRole { get; set; }
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
    }
}
