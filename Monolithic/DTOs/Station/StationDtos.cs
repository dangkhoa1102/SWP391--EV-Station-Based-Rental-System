using System.ComponentModel.DataAnnotations;
using Monolithic.DTOs.Car;

namespace Monolithic.DTOs.Station
{
    public class StationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int TotalSlots { get; set; }
        public int AvailableSlots { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<CarDto>? AvailableCars { get; set; }
    }

    public class CreateStationDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Range(-90, 90)]
        public decimal Latitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal Longitude { get; set; }

        [Required]
        [Range(1, 1000)]
        public int TotalSlots { get; set; }
    }

    public class UpdateStationDto
    {
        public string? Name { get; set; }
        public string? Address { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? TotalSlots { get; set; }
    }

    public class StationCarDto
    {
        public Guid Id { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public decimal CurrentBatteryLevel { get; set; }
        public decimal RentalPricePerHour { get; set; }
        public bool IsAvailable { get; set; }
    }
}