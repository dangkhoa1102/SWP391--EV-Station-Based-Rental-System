using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Contract
{
    public class ContractDto
    {
        public Guid ContractId { get; set; }
        public Guid BookingId { get; set; }
        public Guid RenterId { get; set; }
        public Guid? StaffId { get; set; }
        public string ContractContent { get; set; } = string.Empty;
        public string ContractContentHash { get; set; } = string.Empty;
        public string SignatureType { get; set; } = "EmailConfirmation";
        public string? SignatureValue { get; set; }
        public string? SignerEmail { get; set; }
        public bool IsConfirmed { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ConfirmedAt { get; set; }
        public string? StaffSignature { get; set; }
        public string? CustomerSignature { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? SignedAt { get; set; }
        public string? ContractNotes { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
    }
}