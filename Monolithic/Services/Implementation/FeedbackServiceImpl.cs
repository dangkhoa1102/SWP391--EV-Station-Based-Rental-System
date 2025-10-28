using AutoMapper;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Feedback;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class FeedbackServiceImpl : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IMapper _mapper;

        public FeedbackServiceImpl(
            IFeedbackRepository feedbackRepository, 
            IBookingRepository bookingRepository,
            IMapper mapper)
        {
            _feedbackRepository = feedbackRepository;
            _bookingRepository = bookingRepository;
            _mapper = mapper;
        }

        public async Task<ResponseDto<PaginationDto<FeedbackDto>>> GetFeedbacksAsync(PaginationRequestDto request)
        {
            Expression<Func<Feedback, bool>> predicate = f => f.IsActive;
            var (items, total) = await _feedbackRepository.GetPagedAsync(request.Page, request.PageSize, predicate, f => f.CreatedAt, true);
            var dto = _mapper.Map<List<FeedbackDto>>(items);
            var pagination = new PaginationDto<FeedbackDto>(dto, request.Page, request.PageSize, total);
            return ResponseDto<PaginationDto<FeedbackDto>>.Success(pagination);
        }

        public async Task<ResponseDto<FeedbackDto>> GetFeedbackByIdAsync(Guid id)
        {
            var fb = await _feedbackRepository.GetByIdAsync(id);
            if (fb == null || !fb.IsActive) return ResponseDto<FeedbackDto>.Failure("Feedback not found");
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(fb));
        }

        public async Task<ResponseDto<List<FeedbackDto>>> GetCarFeedbacksAsync(Guid carId)
        {
            var items = await _feedbackRepository.GetFeedbacksByCarAsync(carId);
            return ResponseDto<List<FeedbackDto>>.Success(_mapper.Map<List<FeedbackDto>>(items));
        }

        public async Task<ResponseDto<List<FeedbackDto>>> GetUserFeedbacksAsync(string userId)
        {
            var items = await _feedbackRepository.GetFeedbacksByUserAsync(userId);
            return ResponseDto<List<FeedbackDto>>.Success(_mapper.Map<List<FeedbackDto>>(items));
        }

        public async Task<ResponseDto<FeedbackDto>> GetFeedbackByBookingIdAsync(Guid bookingId)
        {
            var fb = await _feedbackRepository.GetFeedbackByBookingIdAsync(bookingId);
            if (fb == null) return ResponseDto<FeedbackDto>.Failure("Feedback not found for this booking");
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(fb));
        }

        public async Task<ResponseDto<FeedbackDto>> CreateFeedbackAsync(string userId, CreateFeedbackDto request)
        {
            // Validate userId format
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return ResponseDto<FeedbackDto>.Failure("Invalid user ID");
            }

            // Check if booking exists
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null)
            {
                return ResponseDto<FeedbackDto>.Failure("Booking not found");
            }

            // Validate booking belongs to user
            if (booking.UserId != userGuid)
            {
                return ResponseDto<FeedbackDto>.Failure("You can only feedback your own bookings");
            }

            // Validate booking is completed
            if (booking.BookingStatus != BookingStatus.Completed)
            {
                return ResponseDto<FeedbackDto>.Failure("You can only feedback completed bookings");
            }

            // Validate car matches booking
            if (booking.CarId != request.CarId)
            {
                return ResponseDto<FeedbackDto>.Failure("Car ID does not match the booking");
            }

            // Check if user already has feedback for this booking
            var existingFeedback = await _feedbackRepository.HasUserFeedbackForBookingAsync(userId, request.BookingId);
            if (existingFeedback)
            {
                return ResponseDto<FeedbackDto>.Failure("You have already submitted feedback for this booking");
            }

            var fb = _mapper.Map<Feedback>(request);
            fb.FeedbackId = Guid.NewGuid();
            fb.UserId = userGuid;
            fb.CreatedAt = DateTime.UtcNow;
            fb.UpdatedAt = null;
            fb.IsActive = true;

            var created = await _feedbackRepository.AddAsync(fb);
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(created), "Feedback created successfully");
        }

        public async Task<ResponseDto<FeedbackDto>> UpdateFeedbackAsync(Guid id, string userId, UpdateFeedbackDto request)
        {
            var fb = await _feedbackRepository.GetByIdAsync(id);
            if (fb == null || !fb.IsActive) 
                return ResponseDto<FeedbackDto>.Failure("Feedback not found");
            
            // Verify ownership
            if (!Guid.TryParse(userId, out var userGuid) || fb.UserId != userGuid)
                return ResponseDto<FeedbackDto>.Failure("You don't have permission to update this feedback");
            
            fb.Rating = request.Rating;
            fb.Comment = request.Comment;
            fb.UpdatedAt = DateTime.UtcNow;
            
            var updated = await _feedbackRepository.UpdateAsync(fb);
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(updated), "Feedback updated successfully");
        }

        public async Task<ResponseDto<string>> DeleteFeedbackAsync(Guid id, string userId)
        {
            var fb = await _feedbackRepository.GetByIdAsync(id);
            if (fb == null || !fb.IsActive) 
                return ResponseDto<string>.Failure("Feedback not found");
            
            // Verify ownership
            if (!Guid.TryParse(userId, out var userGuid) || fb.UserId != userGuid)
                return ResponseDto<string>.Failure("You don't have permission to delete this feedback");
            
            fb.IsActive = false;
            fb.UpdatedAt = DateTime.UtcNow;
            await _feedbackRepository.UpdateAsync(fb);
            return ResponseDto<string>.Success(string.Empty, "Feedback deleted successfully");
        }

        public async Task<ResponseDto<FeedbackSummaryDto>> GetCarFeedbackSummaryAsync(Guid carId)
        {
            var avg = await _feedbackRepository.GetAverageRatingForCarAsync(carId);
            var count = await _feedbackRepository.GetFeedbackCountForCarAsync(carId);
            var summary = new FeedbackSummaryDto 
            { 
                CarId = carId,
                AverageRating = Math.Round(avg, 2), 
                TotalFeedbacks = count 
            };
            return ResponseDto<FeedbackSummaryDto>.Success(summary);
        }
    }
}