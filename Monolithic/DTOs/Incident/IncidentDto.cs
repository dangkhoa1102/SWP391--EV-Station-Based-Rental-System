namespace Monolithic.DTOs.Incident
{
    public class IncidentDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string Description { get; set; }
        public DateTime ReportedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
