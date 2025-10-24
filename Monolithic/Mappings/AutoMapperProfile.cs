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
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})" : ""));
                //.ForMember(dest => dest.PickupStationName, opt => opt.MapFrom(src => src.PickupStation != null ? src.PickupStation.Name : ""))
                //.ForMember(dest => dest.ReturnStationName, opt => opt.MapFrom(src => src.ReturnStation != null ? src.ReturnStation.Name : null));

            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.BookingStatus, opt => opt.MapFrom(src => BookingStatus.Pending))
                .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => "Pending"))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Booking, BookingStatusDto>()
                .ForMember(dest => dest.Car, opt => opt.MapFrom(src => src.Car));
                //.ForMember(dest => dest.PickupStation, opt => opt.MapFrom(src => src.PickupStation))
                //.ForMember(dest => dest.ReturnStation, opt => opt.MapFrom(src => src.ReturnStation));

            CreateMap<Booking, BookingHistoryDto>()
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Brand} {src.Car.Model}" : ""));
                //.ForMember(dest => dest.PickupStationName, opt => opt.MapFrom(src => src.PickupStation != null ? src.PickupStation.Name : ""))
                //.ForMember(dest => dest.ReturnStationName, opt => opt.MapFrom(src => src.ReturnStation != null ? src.ReturnStation.Name : ""));

            // Feedback mappings
            CreateMap<Feedback, FeedbackDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.FeedbackId)) // Use FeedbackId
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"))
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})"));

            CreateMap<CreateFeedbackDto, Feedback>()
                .ForMember(dest => dest.FeedbackId, opt => opt.MapFrom(src => Guid.NewGuid())) // Use FeedbackId
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

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

            // Payment mappings
            //    CreateMap<Payment, PaymentDto>()
            //        .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => src.PaymentId))
            //        .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.BookingId))
            //        .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => src.TransactionId))
            //        .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.Amount))
            //        .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod))
            //        .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.PaymentStatus))
            //        //.ForMember(dest => dest.GatewayName, opt => opt.MapFrom(src => src.GatewayName))
            //        .ForMember(dest => dest.GatewayTransactionId, opt => opt.MapFrom(src => src.GatewayTransactionId))
            //        //.ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            //        //.ForMember(dest => dest.FailureReason, opt => opt.MapFrom(src => src.FailureReason))
            //        //.ForMember(dest => dest.ProcessedAt, opt => opt.MapFrom(src => src.ProcessedAt))
            //        //.ForMember(dest => dest.ExpiredAt, opt => opt.MapFrom(src => src.ExpiredAt))
            //        //.ForMember(dest => dest.RefundTransactionId, opt => opt.MapFrom(src => src.RefundTransactionId))
            //        .ForMember(dest => dest.RefundedAt, opt => opt.MapFrom(src => src.RefundedAt))
            //        .ForMember(dest => dest.RefundReason, opt => opt.MapFrom(src => src.RefundReason))
            //        .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            //        .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt));

            //    CreateMap<CreatePaymentDto, Payment>()
            //        .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => Guid.NewGuid()))
            //        .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => "")) // Will be set in service
            //        .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => PaymentStatus.Pending))
            //        //.ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            //        .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            //        .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
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