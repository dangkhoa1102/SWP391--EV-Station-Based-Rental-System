using EVStation_basedRentalSystem.Services.BookingAPI.DTOs;
using EVStation_basedRentalSystem.Services.BookingAPI.Models;
using EVStation_basedRentalSystem.Services.BookingAPI.Repository.IRepository;
using EVStation_basedRentalSystem.Services.BookingAPI.Services.IService;

namespace EVStation_basedRentalSystem.Services.BookingAPI.Services
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly ILogger<BookingService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public BookingService(
            IBookingRepository bookingRepository,
            ILogger<BookingService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _bookingRepository = bookingRepository;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        #region Main Booking Flow

        /// <summary>
        /// Step 1: Create a new booking (Đặt xe)
        /// </summary>
        public async Task<ApiResponseDto> CreateBookingAsync(CreateBookingRequestDto request)
        {
            try
            {
                // Validate dates
                if (request.PickupDateTime <= DateTime.UtcNow)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Pickup date must be in the future"
                    };
                }

                if (request.ExpectedReturnDateTime <= request.PickupDateTime)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Return date must be after pickup date"
                    };
                }

                // Check car availability
                var isAvailable = await _bookingRepository.IsCarAvailableAsync(
                    request.CarId, 
                    request.PickupDateTime, 
                    request.ExpectedReturnDateTime);

                if (!isAvailable)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car is not available for the selected dates"
                    };
                }

                // Get car details from CarAPI
                var carDetails = await GetCarDetailsAsync(request.CarId);
                if (carDetails == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Car not found"
                    };
                }

                // Calculate rental duration and pricing
                var duration = request.ExpectedReturnDateTime - request.PickupDateTime;
                var totalHours = duration.TotalHours;
                var totalDays = Math.Ceiling(duration.TotalDays);

                decimal totalAmount;
                if (totalDays >= 1)
                {
                    totalAmount = (decimal)totalDays * carDetails.DailyRate;
                }
                else
                {
                    totalAmount = (decimal)totalHours * carDetails.HourlyRate;
                }

                // Create booking
                var booking = new Booking
                {
                    UserId = request.UserId,
                    CarId = request.CarId,
                    PickupStationId = request.PickupStationId,
                    ReturnStationId = request.ReturnStationId,
                    PickupDateTime = request.PickupDateTime,
                    ExpectedReturnDateTime = request.ExpectedReturnDateTime,
                    BookingStatus = "Pending",
                    HourlyRate = carDetails.HourlyRate,
                    DailyRate = carDetails.DailyRate,
                    DepositAmount = carDetails.DepositAmount,
                    TotalAmount = totalAmount,
                    PaymentStatus = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                var createdBooking = await _bookingRepository.CreateAsync(booking);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking created successfully. Please proceed to payment.",
                    Data = MapToResponseDto(createdBooking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while creating the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        /// <summary>
        /// Step 2: Confirm booking after payment (Xác thực thanh toán)
        /// </summary>
        public async Task<ApiResponseDto> ConfirmBookingAsync(int bookingId)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus != "Pending")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot confirm booking with status: {booking.BookingStatus}"
                    };
                }

                // Check payment status (should be called from PaymentAPI)
                if (booking.PaymentStatus != "Paid")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Payment not completed"
                    };
                }

                booking.BookingStatus = "Confirmed";
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // TODO: Send confirmation email/notification

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking confirmed successfully",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while confirming the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        /// <summary>
        /// Step 3: Check-in process (Nhận xe)
        /// </summary>
        public async Task<ApiResponseDto> CheckInAsync(CheckInRequestDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus != "Confirmed")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot check-in booking with status: {booking.BookingStatus}"
                    };
                }

                // Update booking with check-in details
                booking.BookingStatus = "CheckedIn";
                booking.CheckInDateTime = request.CheckInDateTime;
                booking.CheckInNotes = request.CheckInNotes;
                booking.CheckInPhotoUrl = request.CheckInPhotoUrl;
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // TODO: Update car status to "Rented" in CarAPI

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Check-in completed successfully. Enjoy your ride!",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during check-in");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred during check-in",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        /// <summary>
        /// Step 4: Check-out process (Trả xe)
        /// </summary>
        public async Task<ApiResponseDto> CheckOutAsync(CheckOutRequestDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus != "CheckedIn")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot check-out booking with status: {booking.BookingStatus}"
                    };
                }

                // Update booking with check-out details
                booking.BookingStatus = "CheckedOut";
                booking.CheckOutDateTime = request.CheckOutDateTime;
                booking.ActualReturnDateTime = request.CheckOutDateTime;
                booking.CheckOutNotes = request.CheckOutNotes;
                booking.CheckOutPhotoUrl = request.CheckOutPhotoUrl;

                // Calculate additional fees
                booking.LateFee = request.LateFee ?? 0;
                booking.DamageFee = request.DamageFee ?? 0;

                // Calculate actual amount
                booking.ActualAmount = booking.TotalAmount 
                    + booking.LateFee 
                    + booking.DamageFee;

                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // TODO: Update car status to "Available" in CarAPI
                // TODO: Process additional payment if needed

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Check-out completed successfully. Please proceed to final payment.",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during check-out");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred during check-out",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        /// <summary>
        /// Step 5: Complete booking after final payment (Hoàn thành)
        /// </summary>
        public async Task<ApiResponseDto> CompleteBookingAsync(int bookingId)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus != "CheckedOut")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot complete booking with status: {booking.BookingStatus}"
                    };
                }

                booking.BookingStatus = "Completed";
                booking.PaymentStatus = "Paid";
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // TODO: Send completion email/notification
                // TODO: Request feedback

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking completed successfully. Thank you for using our service!",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while completing the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        #endregion

        #region Booking Management

        public async Task<ApiResponseDto> GetBookingByIdAsync(int bookingId)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> GetAllBookingsAsync()
        {
            try
            {
                var bookings = await _bookingRepository.GetAllAsync();
                var response = bookings.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all bookings");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving bookings",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> GetUserBookingsAsync(string userId)
        {
            try
            {
                var bookings = await _bookingRepository.GetByUserIdAsync(userId);
                var response = bookings.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving user bookings",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> GetBookingsByStatusAsync(string status)
        {
            try
            {
                var bookings = await _bookingRepository.GetByStatusAsync(status);
                var response = bookings.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bookings by status");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving bookings",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> CancelBookingAsync(int bookingId, string reason)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus == "Completed" || booking.BookingStatus == "Cancelled")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot cancel booking with status: {booking.BookingStatus}"
                    };
                }

                booking.BookingStatus = "Cancelled";
                booking.CancellationReason = reason;
                booking.CancelledAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                // TODO: Process refund if applicable
                // TODO: Send cancellation notification

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking cancelled successfully",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while cancelling the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> UpdateBookingAsync(int bookingId, CreateBookingRequestDto request)
        {
            try
            {
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = "Booking not found"
                    };
                }

                if (booking.BookingStatus != "Pending" && booking.BookingStatus != "Confirmed")
                {
                    return new ApiResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Cannot update booking with status: {booking.BookingStatus}"
                    };
                }

                // Update booking details
                booking.PickupStationId = request.PickupStationId;
                booking.ReturnStationId = request.ReturnStationId;
                booking.PickupDateTime = request.PickupDateTime;
                booking.ExpectedReturnDateTime = request.ExpectedReturnDateTime;
                booking.UpdatedAt = DateTime.UtcNow;

                await _bookingRepository.UpdateAsync(booking);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Message = "Booking updated successfully",
                    Data = MapToResponseDto(booking)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while updating the booking",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> CheckCarAvailabilityAsync(int carId, DateTime pickupDateTime, DateTime returnDateTime)
        {
            try
            {
                var isAvailable = await _bookingRepository.IsCarAvailableAsync(carId, pickupDateTime, returnDateTime);

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = new { IsAvailable = isAvailable }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking car availability");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while checking availability",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> GetBookingHistoryAsync(string userId)
        {
            try
            {
                var bookings = await _bookingRepository.GetBookingHistoryAsync(userId);
                var response = bookings.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking history");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving booking history",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponseDto> GetUpcomingBookingsAsync()
        {
            try
            {
                var bookings = await _bookingRepository.GetUpcomingBookingsAsync(DateTime.UtcNow);
                var response = bookings.Select(MapToResponseDto).ToList();

                return new ApiResponseDto
                {
                    IsSuccess = true,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting upcoming bookings");
                return new ApiResponseDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving upcoming bookings",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        #endregion

        #region Helper Methods

        private BookingResponseDto MapToResponseDto(Booking booking)
        {
            return new BookingResponseDto
            {
                BookingId = booking.BookingId,
                UserId = booking.UserId,
                CarId = booking.CarId,
                PickupStationId = booking.PickupStationId,
                ReturnStationId = booking.ReturnStationId,
                PickupDateTime = booking.PickupDateTime,
                ExpectedReturnDateTime = booking.ExpectedReturnDateTime,
                ActualReturnDateTime = booking.ActualReturnDateTime,
                BookingStatus = booking.BookingStatus,
                CheckInDateTime = booking.CheckInDateTime,
                CheckOutDateTime = booking.CheckOutDateTime,
                HourlyRate = booking.HourlyRate,
                DailyRate = booking.DailyRate,
                DepositAmount = booking.DepositAmount,
                TotalAmount = booking.TotalAmount,
                ActualAmount = booking.ActualAmount,
                LateFee = booking.LateFee,
                DamageFee = booking.DamageFee,
                PaymentStatus = booking.PaymentStatus,
                PaymentMethod = booking.PaymentMethod,
                CreatedAt = booking.CreatedAt
            };
        }

        private async Task<dynamic?> GetCarDetailsAsync(int carId)
        {
            try
            {
                // TODO: Call CarAPI to get car details
                // For now, return mock data
                return new
                {
                    CarId = carId,
                    HourlyRate = 50000m,
                    DailyRate = 500000m,
                    DepositAmount = 2000000m
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting car details");
                return null;
            }
        }

        #endregion
    }
}

