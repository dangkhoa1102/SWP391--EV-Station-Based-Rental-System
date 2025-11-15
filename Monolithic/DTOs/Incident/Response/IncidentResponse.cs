using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Incident.Response
{
    public class IncidentResponse
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string Description { get; set; }
        public List<string>? Images { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime ReportedAt { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? ResolvedAt { get; set; }
        public string Status { get; set; }
        public string? ResolutionNotes { get; set; }
        public decimal? CostIncurred { get; set; }
        public Guid? ResolvedBy { get; set; }
        public Guid? StationId { get; set; }
        public Guid? StaffId { get; set; }

        // Additional info for better response
        public string? BookingInfo { get; set; }
        public string? StaffName { get; set; }
        public string? ResolverName { get; set; }
        public bool IsDeleted { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }
    }
}