using EVStation_basedRendtalSystem.Services.FeedbackAPI.DTOs;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Models;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository.IRepository;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Services.IService;

namespace EVStation_basedRendtalSystem.Services.FeedbackAPI.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;

        public FeedbackService(IFeedbackRepository feedbackRepository)
        {
            _feedbackRepository = feedbackRepository;
        }

        public async Task<ApiResponseDto> CreateFeedbackAsync(CreateFeedbackRequestDto request)
        {
            try
            {
                // Check if user already has feedback for this booking
                var existingFeedback = await _feedbackRepository.HasUserFeedbackForBookingAsync(request.UserId, request.BookingId);
                if (existingFeedback)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "You have already submitted feedback for this booking.",
                        Data = null
                    };
                }

                var feedback = new Feedback
                {
                    UserId = request.UserId,
                    BookingId = request.BookingId,
                    CarId = request.CarId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var createdFeedback = await _feedbackRepository.CreateAsync(feedback);

                var response = MapToResponseDto(createdFeedback);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedback created successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error creating feedback: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                var feedback = await _feedbackRepository.GetByIdAsync(feedbackId);
                if (feedback == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Feedback not found",
                        Data = null
                    };
                }

                var response = MapToResponseDto(feedback);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedback retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving feedback: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetAllFeedbacksAsync()
        {
            try
            {
                var feedbacks = await _feedbackRepository.GetAllAsync();
                var response = feedbacks.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedbacks retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving feedbacks: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetFeedbacksByUserIdAsync(string userId)
        {
            try
            {
                var feedbacks = await _feedbackRepository.GetByUserIdAsync(userId);
                var response = feedbacks.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "User feedbacks retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving user feedbacks: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetFeedbacksByCarIdAsync(int carId)
        {
            try
            {
                var feedbacks = await _feedbackRepository.GetByCarIdAsync(carId);
                var response = feedbacks.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Car feedbacks retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving car feedbacks: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetFeedbackByBookingIdAsync(int bookingId)
        {
            try
            {
                var feedback = await _feedbackRepository.GetByBookingIdAsync(bookingId);
                if (feedback == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Feedback not found for this booking",
                        Data = null
                    };
                }

                var response = MapToResponseDto(feedback);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking feedback retrieved successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving booking feedback: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto request)
        {
            try
            {
                var feedback = await _feedbackRepository.GetByIdAsync(feedbackId);
                if (feedback == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Feedback not found",
                        Data = null
                    };
                }

                feedback.Rating = request.Rating;
                feedback.Comment = request.Comment;

                var updatedFeedback = await _feedbackRepository.UpdateAsync(feedback);
                var response = MapToResponseDto(updatedFeedback);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedback updated successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error updating feedback: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> DeleteFeedbackAsync(int feedbackId)
        {
            try
            {
                var result = await _feedbackRepository.DeleteAsync(feedbackId);
                if (!result)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Feedback not found",
                        Data = null
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedback deleted successfully",
                    Data = null
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error deleting feedback: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarAverageRatingAsync(int carId)
        {
            try
            {
                var averageRating = await _feedbackRepository.GetAverageRatingByCarIdAsync(carId);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Average rating retrieved successfully",
                    Data = new { CarId = carId, AverageRating = Math.Round(averageRating, 2) }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving average rating: {ex.Message}",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDto> GetCarFeedbackStatsAsync(int carId)
        {
            try
            {
                var averageRating = await _feedbackRepository.GetAverageRatingByCarIdAsync(carId);
                var feedbackCount = await _feedbackRepository.GetFeedbackCountByCarIdAsync(carId);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Feedback statistics retrieved successfully",
                    Data = new
                    {
                        CarId = carId,
                        AverageRating = Math.Round(averageRating, 2),
                        TotalFeedbacks = feedbackCount
                    }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = $"Error retrieving feedback statistics: {ex.Message}",
                    Data = null
                };
            }
        }

        private FeedbackResponseDto MapToResponseDto(Feedback feedback)
        {
            return new FeedbackResponseDto
            {
                FeedbackId = feedback.FeedbackId,
                UserId = feedback.UserId,
                BookingId = feedback.BookingId,
                CarId = feedback.CarId,
                Rating = feedback.Rating,
                Comment = feedback.Comment,
                CreatedAt = feedback.CreatedAt,
                UpdatedAt = feedback.UpdatedAt,
                IsActive = feedback.IsActive
            };
        }
    }
}

