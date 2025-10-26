using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IBookingService
    {
        // Main booking flow methods (New Flow)
        Task<ResponseDto<BookingDto>> CreateBookingAsync(string userId, CreateBookingDto request);
        
        Task<ResponseDto<BookingDto>> CheckInWithContractAsync(CheckInWithContractDto request);
        Task<ResponseDto<BookingDto>> CheckOutWithPaymentAsync(CheckOutWithPaymentDto request);
        
        
        // Booking management methods
        Task<ResponseDto<PaginationDto<BookingDto>>> GetBookingsAsync(PaginationRequestDto request);
        Task<ResponseDto<BookingDto>> GetBookingByIdAsync(Guid id);
        Task<ResponseDto<List<BookingDto>>> GetUserBookingsAsync(string userId);
        Task<ResponseDto<BookingDto>> UpdateBookingAsync(Guid id, UpdateBookingDto request);
        Task<ResponseDto<string>> CancelBookingAsync(Guid id, string userId, string? reason = null);
        
        // Utility methods
        Task<ResponseDto<bool>> CheckCarAvailabilityAsync(CheckAvailabilityDto request);
        Task<ResponseDto<decimal>> CalculateBookingCostAsync(Guid carId, DateTime startTime, DateTime endTime);
        Task<ResponseDto<BookingStatusDto>> GetActiveBookingAsync(string userId);
        Task<ResponseDto<List<BookingHistoryDto>>> GetBookingHistoryAsync(string userId);
        Task<ResponseDto<List<BookingDto>>> GetUpcomingBookingsAsync();
    }
}