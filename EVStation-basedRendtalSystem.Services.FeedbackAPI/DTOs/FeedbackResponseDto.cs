namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.DTOs
{
    public class FeedbackResponseDto
    {
        public int FeedbackId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int BookingId { get; set; }
        public int CarId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }
}

