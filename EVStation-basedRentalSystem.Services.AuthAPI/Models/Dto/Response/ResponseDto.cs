namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response
{
    public class ResponseDto
    {
        public object? Result { get; set; }
        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = "";
        public int StatusCode { get; set; }
        public string? ErrorCode { get; set; }
    }
}
