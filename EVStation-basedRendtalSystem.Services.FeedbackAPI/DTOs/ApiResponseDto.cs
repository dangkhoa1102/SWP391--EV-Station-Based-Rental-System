namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.DTOs
{
    public class ApiResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
}

