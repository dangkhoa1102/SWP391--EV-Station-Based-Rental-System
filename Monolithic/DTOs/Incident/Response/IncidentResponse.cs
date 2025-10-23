using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Incident.Response
{
    public class IncidentResponse
    {
        public int Id { get; set; }
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
        public int? ResolvedBy { get; set; }
        public int ReportedBy { get; set; }
        public Guid? StationId { get; set; }

        // Additional info for better response
        public string? BookingInfo { get; set; }
        public string? ReporterName { get; set; }
        public string? ResolverName { get; set; }
    }
}