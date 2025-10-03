namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response
{
    public class IntrospectResponseDto
    {
        public bool IsValid { get; set; } // Indicates if the token is valid
        public string? UserId { get; set; } // The user ID associated with the token
        public DateTime? ExpiresAt { get; set; } // Token expiration time
        public List<string>? Roles { get; set; } // Roles associated with the token
        public string? Message { get; set; } // Optional message for errors or info
    }
}
