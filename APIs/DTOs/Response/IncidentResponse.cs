namespace APIs.DTOs.Response
{
    public class IncidentResponse
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public string Description { get; set; }
        public DateTime ReportAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string Status { get; set; }
    }
}
