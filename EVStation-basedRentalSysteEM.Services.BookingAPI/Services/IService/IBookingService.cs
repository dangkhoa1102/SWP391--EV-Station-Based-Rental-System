using EVStation_basedRentalSystem.Services.BookingAPI.DTOs;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Services.IService
{
    public interface IBookingService
    {
        // Main booking flow
        Task<ApiResponseDto> CreateBookingAsync(CreateBookingRequestDto request);
        Task<ApiResponseDto> ConfirmBookingAsync(int bookingId);
        Task<ApiResponseDto> CheckInAsync(CheckInRequestDto request);
        Task<ApiResponseDto> CheckOutAsync(CheckOutRequestDto request);
        Task<ApiResponseDto> CompleteBookingAsync(int bookingId);
        
        // Booking management
        Task<ApiResponseDto> GetBookingByIdAsync(int bookingId);
        Task<ApiResponseDto> GetAllBookingsAsync();
        Task<ApiResponseDto> GetUserBookingsAsync(string userId);
        Task<ApiResponseDto> GetBookingsByStatusAsync(string status);
        Task<ApiResponseDto> CancelBookingAsync(int bookingId, string reason);
        Task<ApiResponseDto> UpdateBookingAsync(int bookingId, CreateBookingRequestDto request);
        
        // Car availability
        Task<ApiResponseDto> CheckCarAvailabilityAsync(int carId, DateTime pickupDateTime, DateTime returnDateTime);
        
        // Booking history
        Task<ApiResponseDto> GetBookingHistoryAsync(string userId);
        Task<ApiResponseDto> GetUpcomingBookingsAsync();
    }
}

