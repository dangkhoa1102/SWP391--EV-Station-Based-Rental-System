using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IBookingService
    {
        Task<ResponseDto<PaginationDto<BookingDto>>> GetBookingsAsync(PaginationRequestDto request);
        Task<ResponseDto<BookingDto>> GetBookingByIdAsync(Guid id);
        Task<ResponseDto<List<BookingDto>>> GetUserBookingsAsync(string userId);
        Task<ResponseDto<BookingDto>> CreateBookingAsync(string userId, CreateBookingDto request);
        Task<ResponseDto<BookingDto>> UpdateBookingAsync(Guid id, UpdateBookingDto request);
        Task<ResponseDto<string>> CancelBookingAsync(Guid id, string userId);
        Task<ResponseDto<BookingDto>> StartBookingAsync(Guid id, string userId);
        Task<ResponseDto<BookingDto>> CompleteBookingAsync(Guid id, string userId, Guid dropoffStationId);
        Task<ResponseDto<BookingStatusDto>> GetActiveBookingAsync(string userId);
        Task<ResponseDto<decimal>> CalculateBookingCostAsync(Guid carId, DateTime startTime, DateTime endTime);
    }
}