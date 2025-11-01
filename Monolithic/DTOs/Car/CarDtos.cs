using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Car
{
    public class CarDto
    {
        public Guid Id { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Color { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public decimal BatteryCapacity { get; set; }
        public decimal CurrentBatteryLevel { get; set; }
        public decimal RentalPricePerHour { get; set; }

        public decimal RentalPricePerDay { get; set; }
        public bool IsAvailable { get; set; }
        public Guid CurrentStationId { get; set; }
        public string CurrentStationName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime UpdatedAt { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class CreateCarDto
    {
        [Required]
        public string Brand { get; set; } = string.Empty;

        [Required]
        public string Model { get; set; } = string.Empty;

        [Required]
        [Range(2000, 2050)]
        public int Year { get; set; }

        [Required]
        public string Color { get; set; } = string.Empty;

        [Required]
        public string LicensePlate { get; set; } = string.Empty;

        [Required]
        [Range(1, 1000)]
        public decimal BatteryCapacity { get; set; }

        [Required]
        [Range(0, 100)]
        public decimal CurrentBatteryLevel { get; set; }

        [Required]
        [Range(0.01, 1000000000000000000)]
        public decimal RentalPricePerHour { get; set; }
        [Required]
        [Range(0.01, 1000000000000000000)]
        public decimal RentalPricePerDay { get; set; }


        [Required]
        public Guid CurrentStationId { get; set; }

        // Optional: Car image file
        public IFormFile? CarImage { get; set; }
    }

    public class UpdateCarDto
    {
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public int? Year { get; set; }
        public string? Color { get; set; }
        public string? LicensePlate { get; set; }
        public decimal? BatteryCapacity { get; set; }
        public decimal? CurrentBatteryLevel { get; set; }
        public decimal? RentalPricePerHour { get; set; }
        public decimal? RentalPricePerDay { get; set; }
        public bool? IsAvailable { get; set; }
        public Guid? CurrentStationId { get; set; }
    }
}