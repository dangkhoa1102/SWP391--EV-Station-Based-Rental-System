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
        private readonly IMapper _mapper;

        public FeedbackServiceImpl(IFeedbackRepository feedbackRepository, IMapper mapper)
        {
            _feedbackRepository = feedbackRepository;
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

        public async Task<ResponseDto<FeedbackDto>> CreateFeedbackAsync(string userId, CreateFeedbackDto request)
        {
            var fb = _mapper.Map<Feedback>(request);
            fb.FeedbackId = Guid.NewGuid(); // Use FeedbackId
            if (Guid.TryParse(userId, out var userGuid))
            {
                fb.UserId = userGuid; // Convert string to Guid
            }
            else
            {
                return ResponseDto<FeedbackDto>.Failure("Invalid user ID");
            }
            fb.CreatedAt = DateTime.UtcNow;
            fb.UpdatedAt = DateTime.UtcNow;
            fb.IsActive = true;
            var created = await _feedbackRepository.AddAsync(fb);
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(created), "Feedback created");
        }

        public async Task<ResponseDto<FeedbackDto>> UpdateFeedbackAsync(Guid id, string userId, UpdateFeedbackDto request)
        {
            var fb = await _feedbackRepository.GetByIdAsync(id);
            if (fb == null || !fb.IsActive) return ResponseDto<FeedbackDto>.Failure("Feedback not found");
            
            if (Guid.TryParse(userId, out var userGuid) && fb.UserId != userGuid) // Convert and compare Guid
                return ResponseDto<FeedbackDto>.Failure("Feedback not found");
            
            if (request.Rating.HasValue) fb.Rating = request.Rating.Value;
            if (!string.IsNullOrWhiteSpace(request.Comment)) fb.Comment = request.Comment!;
            fb.UpdatedAt = DateTime.UtcNow;
            var updated = await _feedbackRepository.UpdateAsync(fb);
            return ResponseDto<FeedbackDto>.Success(_mapper.Map<FeedbackDto>(updated), "Feedback updated");
        }

        public async Task<ResponseDto<string>> DeleteFeedbackAsync(Guid id, string userId)
        {
            var fb = await _feedbackRepository.GetByIdAsync(id);
            if (fb == null || !fb.IsActive) return ResponseDto<string>.Failure("Feedback not found");
            
            if (Guid.TryParse(userId, out var userGuid) && fb.UserId != userGuid) // Convert and compare Guid
                return ResponseDto<string>.Failure("Feedback not found");
            
            fb.IsActive = false;
            fb.UpdatedAt = DateTime.UtcNow;
            await _feedbackRepository.UpdateAsync(fb);
            return ResponseDto<string>.Success(string.Empty, "Feedback deleted");
        }

        public async Task<ResponseDto<FeedbackSummaryDto>> GetCarFeedbackSummaryAsync(Guid carId)
        {
            var avg = await _feedbackRepository.GetAverageRatingForCarAsync(carId);
            var count = await _feedbackRepository.GetFeedbackCountForCarAsync(carId);
            var summary = new FeedbackSummaryDto { AverageRating = avg, TotalFeedbacks = count };
            return ResponseDto<FeedbackSummaryDto>.Success(summary);
        }
    }
}