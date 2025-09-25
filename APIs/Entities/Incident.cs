namespace APIs.Entities
{
    public class Incident
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public string Description { get; set; }
        public DateTime ReportAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Resolved

        public Booking Booking { get; set; }
    }
}
