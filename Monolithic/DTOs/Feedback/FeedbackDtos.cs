using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Feedback
{
    public class FeedbackDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateFeedbackDto
    {
        [Required]
        public Guid CarId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class UpdateFeedbackDto
    {
        [Range(1, 5)]
        public int? Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class FeedbackSummaryDto
    {
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int TotalFeedbacks { get; set; }
        public List<FeedbackDto> RecentFeedbacks { get; set; } = new();
    }
}