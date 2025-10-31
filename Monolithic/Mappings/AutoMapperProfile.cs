using AutoMapper;
using Monolithic.Models;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Station;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Feedback;
using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Payment;

namespace Monolithic.Mappings
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.UserId.ToString())) // Use UserId
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.UserRole, opt => opt.MapFrom(src => src.UserRole))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive));

            CreateMap<RegisterRequestDto, User>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => GetFirstName(src.FullName)))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => GetLastName(src.FullName)))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.UserRole, opt => opt.MapFrom(src => "Customer"));

            // Car mappings
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CarId)) // Use CarId
                .ForMember(dest => dest.CurrentStationName, opt => opt.MapFrom(src => src.CurrentStation != null ? src.CurrentStation.Name : ""));

            CreateMap<CreateCarDto, Car>()
                .ForMember(dest => dest.CarId, opt => opt.MapFrom(src => Guid.NewGuid())) // Use CarId
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Car, StationCarDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CarId)); // Use CarId

            // Station mappings
            CreateMap<Station, StationDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.StationId)) // Use StationId
                .ForMember(dest => dest.AvailableCars, opt => opt.MapFrom(src => src.Cars.Where(c => c.IsAvailable && c.IsActive)));

            CreateMap<CreateStationDto, Station>()
                .ForMember(dest => dest.StationId, opt => opt.MapFrom(src => Guid.NewGuid())) // Use StationId
                .ForMember(dest => dest.AvailableSlots, opt => opt.MapFrom(src => src.TotalSlots))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // Booking mappings
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : ""))
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})" : ""))
                .ForMember(dest => dest.StationId, opt => opt.MapFrom(src => src.StationId))
                .ForMember(dest => dest.StationName, opt => opt.MapFrom(src => src.Station != null ? src.Station.Name : ""))
                .ForMember(dest => dest.PickupDateTime, opt => opt.MapFrom(src => src.StartTime))
                .ForMember(dest => dest.ExpectedReturnDateTime, opt => opt.MapFrom(src => src.EndTime));


            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.StationId, opt => opt.MapFrom(src => src.StationId))
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.PickupDateTime))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.ExpectedReturnDateTime))
                .ForMember(dest => dest.BookingStatus, opt => opt.MapFrom(src => BookingStatus.Pending))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Booking, BookingStatusDto>()
                .ForMember(dest => dest.Car, opt => opt.MapFrom(src => src.Car))
                .ForMember(dest => dest.Station, opt => opt.MapFrom(src => src.Station))
                .ForMember(dest => dest.PickupDateTime, opt => opt.MapFrom(src => src.StartTime))
                .ForMember(dest => dest.ExpectedReturnDateTime, opt => opt.MapFrom(src => src.EndTime));


            CreateMap<Booking, BookingHistoryDto>()
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Brand} {src.Car.Model}" : ""))
                .ForMember(dest => dest.StationName, opt => opt.MapFrom(src => src.Station != null ? src.Station.Name : ""))
                .ForMember(dest => dest.PickupDateTime, opt => opt.MapFrom(src => src.StartTime));


            // Feedback mappings
            CreateMap<Feedback, FeedbackDto>()
                .ForMember(dest => dest.FeedbackId, opt => opt.MapFrom(src => src.FeedbackId))
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId.ToString()))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : ""))
                .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
                .ForMember(dest => dest.CarId, opt => opt.MapFrom(src => src.CarId))
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})" : ""))
                .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
                .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt));

            CreateMap<CreateFeedbackDto, Feedback>()
                .ForMember(dest => dest.FeedbackId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
                .ForMember(dest => dest.CarId, opt => opt.MapFrom(src => src.CarId))
                .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
                .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore()) // Set manually in service
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Car, opt => opt.Ignore())
                .ForMember(dest => dest.Booking, opt => opt.Ignore());

            // Contract mappings
            CreateMap<Contract, ContractDto>()
                .ForMember(dest => dest.ContractId, opt => opt.MapFrom(src => src.ContractId))
                .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
                .ForMember(dest => dest.RenterId, opt => opt.MapFrom(src => src.RenterId))
                .ForMember(dest => dest.StaffId, opt => opt.MapFrom(src => src.StaffId))
                .ForMember(dest => dest.ContractContent, opt => opt.MapFrom(src => src.ContractContent))
                .ForMember(dest => dest.ContractContentHash, opt => opt.MapFrom(src => src.ContractContentHash))
                .ForMember(dest => dest.SignatureType, opt => opt.MapFrom(src => src.SignatureType))
                .ForMember(dest => dest.SignatureValue, opt => opt.MapFrom(src => src.SignatureValue))
                .ForMember(dest => dest.SignerEmail, opt => opt.MapFrom(src => src.SignerEmail))
                .ForMember(dest => dest.IsConfirmed, opt => opt.MapFrom(src => src.IsConfirmed))
                .ForMember(dest => dest.ConfirmedAt, opt => opt.MapFrom(src => src.ConfirmedAt))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<CreateContractDto, Contract>()
                .ForMember(dest => dest.ContractId, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.ContractContent, opt => opt.MapFrom(src => src.ContractContent))
                .ForMember(dest => dest.SignatureValue, opt => opt.MapFrom(src => src.SignatureValue))
                .ForMember(dest => dest.SignerEmail, opt => opt.MapFrom(src => src.SignerEmail));
            CreateMap<Payment, PaymentDto>()
    .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => src.PaymentId))
    .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
    .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => src.TransactionId))
    .ForMember(dest => dest.OrderCode, opt => opt.MapFrom(src => src.OrderCode))
    .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.Amount))
    .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.PaymentStatus))
    .ForMember(dest => dest.PaymentType, opt => opt.MapFrom(src => src.PaymentType))
    .ForMember(dest => dest.PaidAt, opt => opt.MapFrom(src => src.PaidAt))
    .ForMember(dest => dest.RefundedAt, opt => opt.MapFrom(src => src.RefundedAt))
    .ForMember(dest => dest.RefundReason, opt => opt.MapFrom(src => src.RefundReason))
    .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
    .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt));

            CreateMap<CreatePaymentDto, Payment>()
      .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => Guid.NewGuid()))
      .ForMember(dest => dest.PaymentType, opt => opt.MapFrom(src => src.PaymentType))
      .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => PaymentStatus.Pending))
      .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => string.Empty))
      .ForMember(dest => dest.OrderCode, opt => opt.Ignore())
      .ForMember(dest => dest.PaidAt, opt => opt.Ignore())
      .ForMember(dest => dest.RefundedAt, opt => opt.Ignore())
      .ForMember(dest => dest.RefundReason, opt => opt.Ignore())
      .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
      .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
      .ForMember(dest => dest.Amount, opt => opt.Ignore()); // Set manually in service
        }

        private static string GetFirstName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return "";

            var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[0] : "";
        }

        private static string GetLastName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                return "";

            var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
        }
    }
}