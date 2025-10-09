using AutoMapper;
using Monolithic.Models;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Car;
using Monolithic.DTOs.Station;
using Monolithic.DTOs.Booking;
using Monolithic.DTOs.Feedback;

namespace Monolithic.Mappings
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // User mappings
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive));

            CreateMap<RegisterRequestDto, ApplicationUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true));

            // Car mappings
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.CurrentStationName, opt => opt.MapFrom(src => src.CurrentStation != null ? src.CurrentStation.Name : ""));

            CreateMap<CreateCarDto, Car>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Car, StationCarDto>();

            // Station mappings
            CreateMap<Station, StationDto>()
                .ForMember(dest => dest.AvailableCars, opt => opt.MapFrom(src => src.Cars.Where(c => c.IsAvailable && c.IsActive)));

            CreateMap<CreateStationDto, Station>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.AvailableSlots, opt => opt.MapFrom(src => src.TotalSlots))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // Booking mappings
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"))
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})"))
                .ForMember(dest => dest.PickupStationName, opt => opt.MapFrom(src => src.PickupStation.Name))
                .ForMember(dest => dest.DropoffStationName, opt => opt.MapFrom(src => src.DropoffStation != null ? src.DropoffStation.Name : null));

            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Pending"))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Booking, BookingStatusDto>()
                .ForMember(dest => dest.Car, opt => opt.MapFrom(src => src.Car))
                .ForMember(dest => dest.PickupStation, opt => opt.MapFrom(src => src.PickupStation))
                .ForMember(dest => dest.DropoffStation, opt => opt.MapFrom(src => src.DropoffStation));

            // Feedback mappings
            CreateMap<Feedback, FeedbackDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"))
                .ForMember(dest => dest.CarInfo, opt => opt.MapFrom(src => $"{src.Car.Brand} {src.Car.Model} ({src.Car.LicensePlate})"));

            CreateMap<CreateFeedbackDto, Feedback>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        }
    }
}