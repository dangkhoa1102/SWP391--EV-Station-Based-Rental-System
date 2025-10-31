using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Feedback
{
    public class FeedbackDto
    {
        public Guid FeedbackId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public Guid BookingId { get; set; }
        public Guid CarId { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsActive { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateFeedbackDto
    {
        [Required(ErrorMessage = "BookingId is required")]
        public Guid BookingId { get; set; }

        [Required(ErrorMessage = "CarId is required")]
        public Guid CarId { get; set; }

        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
        public string? Comment { get; set; }
    }

    public class UpdateFeedbackDto
    {
        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
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