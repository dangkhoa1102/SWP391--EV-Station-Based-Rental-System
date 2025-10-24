using System.Text.Json.Serialization;

namespace EVStation_basedRentalSystem.Services.BookingAPI.DTOs
{
    public class BookingResponseDto
    {
        public int BookingId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int CarId { get; set; }
        public string? CarInfo { get; set; } // Brand + Model
        public int PickupStationId { get; set; }
        public string? PickupStationName { get; set; }
        public int ReturnStationId { get; set; }
        public string? ReturnStationName { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime PickupDateTime { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ExpectedReturnDateTime { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ActualReturnDateTime { get; set; }
        public string BookingStatus { get; set; } = string.Empty;
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? CheckInDateTime { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? CheckOutDateTime { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal DailyRate { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? ActualAmount { get; set; }
        public decimal? LateFee { get; set; }
        public decimal? DamageFee { get; set; }
        public string? PaymentStatus { get; set; }
        public string? PaymentMethod { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
    }
}

