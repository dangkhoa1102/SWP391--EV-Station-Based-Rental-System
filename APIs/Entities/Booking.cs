namespace APIs.Entities
{
    public class Booking
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? StaffId { get; set; }
        public int CarId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; }

        public ICollection<Incident> Incidents { get; set; }
    }
}
