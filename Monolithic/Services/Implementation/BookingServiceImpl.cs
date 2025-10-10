using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class BookingServiceImpl : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly ICarRepository _carRepository;
        private readonly IStationRepository _stationRepository;
        private readonly IMapper _mapper;

        public BookingServiceImpl(IBookingRepository bookingRepository, ICarRepository carRepository, IStationRepository stationRepository, IMapper mapper)
        {
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _stationRepository = stationRepository;
            _mapper = mapper;
        }

        public async Task<ResponseDto<PaginationDto<BookingDto>>> GetBookingsAsync(PaginationRequestDto request)
        {
            Expression<Func<Booking, bool>> predicate = b => b.IsActive;
            var (items, total) = await _bookingRepository.GetPagedAsync(request.Page, request.PageSize, predicate, b => b.CreatedAt, true);
            var dto = _mapper.Map<List<BookingDto>>(items);
            var pagination = new PaginationDto<BookingDto>(dto, request.Page, request.PageSize, total);
            return ResponseDto<PaginationDto<BookingDto>>.Success(pagination);
        }

        public async Task<ResponseDto<BookingDto>> GetBookingByIdAsync(Guid id)
        {
            var booking = await _bookingRepository.GetBookingWithDetailsAsync(id);
            if (booking == null || !booking.IsActive) return ResponseDto<BookingDto>.Failure("Booking not found");
            return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(booking));
        }

        public async Task<ResponseDto<List<BookingDto>>> GetUserBookingsAsync(string userId)
        {
            var items = await _bookingRepository.GetUserBookingsAsync(userId);
            return ResponseDto<List<BookingDto>>.Success(_mapper.Map<List<BookingDto>>(items));
        }

        public async Task<ResponseDto<BookingDto>> CreateBookingAsync(string userId, CreateBookingDto request)
        {
            var car = await _carRepository.GetByIdAsync(request.CarId);
            if (car == null || !car.IsActive || !car.IsAvailable) return ResponseDto<BookingDto>.Failure("Car not available");

            var pickup = await _stationRepository.GetByIdAsync(request.PickupStationId);
            if (pickup == null || !pickup.IsActive) return ResponseDto<BookingDto>.Failure("Pickup station invalid");

            var hasActive = await _bookingRepository.HasActiveBookingForCarAsync(request.CarId);
            if (hasActive) return ResponseDto<BookingDto>.Failure("Car already booked");

            var booking = _mapper.Map<Booking>(request);
            booking.BookingId = Guid.NewGuid(); // Use BookingId
            if (Guid.TryParse(userId, out var userGuid))
            {
                booking.UserId = userGuid; // Convert string to Guid
            }
            else
            {
                return ResponseDto<BookingDto>.Failure("Invalid user ID");
            }
            booking.Status = "Pending";
            booking.IsActive = true;
            booking.CreatedAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            var created = await _bookingRepository.AddAsync(booking);
            await _carRepository.UpdateCarStatusAsync(booking.CarId, false);
            await _stationRepository.UpdateAvailableSlotsAsync(booking.PickupStationId, -1);

            return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(created), "Booking created");
        }

        public async Task<ResponseDto<BookingDto>> UpdateBookingAsync(Guid id, UpdateBookingDto request)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null || !booking.IsActive) return ResponseDto<BookingDto>.Failure("Booking not found");

            if (request.EndTime.HasValue) booking.EndTime = request.EndTime.Value;
            if (!string.IsNullOrWhiteSpace(request.Status)) booking.Status = request.Status!;
            booking.UpdatedAt = DateTime.UtcNow;

            var updated = await _bookingRepository.UpdateAsync(booking);
            return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking updated");
        }

        public async Task<ResponseDto<string>> CancelBookingAsync(Guid id, string userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null || !booking.IsActive) return ResponseDto<string>.Failure("Booking not found");
            
            if (Guid.TryParse(userId, out var userGuid) && booking.UserId != userGuid) // Convert and compare Guid
                return ResponseDto<string>.Failure("Booking not found");
            
            booking.Status = "Cancelled";
            booking.UpdatedAt = DateTime.UtcNow;
            await _bookingRepository.UpdateAsync(booking);
            await _carRepository.UpdateCarStatusAsync(booking.CarId, true);
            await _stationRepository.UpdateAvailableSlotsAsync(booking.PickupStationId, +1);
            return ResponseDto<string>.Success(string.Empty, "Booking cancelled");
        }

        public async Task<ResponseDto<BookingDto>> StartBookingAsync(Guid id, string userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null || !booking.IsActive) return ResponseDto<BookingDto>.Failure("Booking not found");
            
            if (Guid.TryParse(userId, out var userGuid) && booking.UserId != userGuid) // Convert and compare Guid
                return ResponseDto<BookingDto>.Failure("Booking not found");
            
            booking.Status = "InProgress";
            booking.StartTime = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;
            var updated = await _bookingRepository.UpdateAsync(booking);
            return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking started");
        }

        public async Task<ResponseDto<BookingDto>> CompleteBookingAsync(Guid id, string userId, Guid dropoffStationId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null || !booking.IsActive) return ResponseDto<BookingDto>.Failure("Booking not found");
            
            if (Guid.TryParse(userId, out var userGuid) && booking.UserId != userGuid) // Convert and compare Guid
                return ResponseDto<BookingDto>.Failure("Booking not found");

            var drop = await _stationRepository.GetByIdAsync(dropoffStationId);
            if (drop == null || !drop.IsActive) return ResponseDto<BookingDto>.Failure("Dropoff station invalid");

            booking.Status = "Completed";
            booking.DropoffStationId = dropoffStationId;
            booking.EndTime = DateTime.UtcNow;
            booking.TotalAmount = await CalculateBookingCostInternal(booking);
            booking.UpdatedAt = DateTime.UtcNow;
            var updated = await _bookingRepository.UpdateAsync(booking);

            await _carRepository.UpdateCarStatusAsync(booking.CarId, true);
            await _carRepository.UpdateCarLocationAsync(booking.CarId, dropoffStationId);
            await _stationRepository.UpdateAvailableSlotsAsync(dropoffStationId, -1);
            await _stationRepository.UpdateAvailableSlotsAsync(booking.PickupStationId, +1);

            return ResponseDto<BookingDto>.Success(_mapper.Map<BookingDto>(updated), "Booking completed");
        }

        public async Task<ResponseDto<BookingStatusDto>> GetActiveBookingAsync(string userId)
        {
            var booking = await _bookingRepository.GetActiveBookingByUserAsync(userId);
            if (booking == null) return ResponseDto<BookingStatusDto>.Failure("No active booking");
            return ResponseDto<BookingStatusDto>.Success(_mapper.Map<BookingStatusDto>(booking));
        }

        public async Task<ResponseDto<decimal>> CalculateBookingCostAsync(Guid carId, DateTime startTime, DateTime endTime)
        {
            if (endTime <= startTime) return ResponseDto<decimal>.Failure("Invalid time range");
            var car = await _carRepository.GetByIdAsync(carId);
            if (car == null || !car.IsActive) return ResponseDto<decimal>.Failure("Car not found");
            var hours = (decimal)(endTime - startTime).TotalHours;
            var cost = Math.Round(hours * car.RentalPricePerHour, 2, MidpointRounding.AwayFromZero);
            return ResponseDto<decimal>.Success(cost);
        }

        private async Task<decimal> CalculateBookingCostInternal(Booking booking)
        {
            var car = await _carRepository.GetByIdAsync(booking.CarId) ?? throw new InvalidOperationException("Car not found");
            var end = booking.EndTime ?? DateTime.UtcNow;
            var hours = (decimal)(end - booking.StartTime).TotalHours;
            return Math.Round(hours * car.RentalPricePerHour, 2, MidpointRounding.AwayFromZero);
        }
    }
}