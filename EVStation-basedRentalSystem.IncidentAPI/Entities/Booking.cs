using System.ComponentModel.DataAnnotations;

namespace IncidentAPI.Entities
{
    public class Booking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int CarId { get; set; }

        public int? StaffId { get; set; }

        [Required]
        public int PickupStationId { get; set; }

        [Required]
        public int ReturnStationId { get; set; }

        [Required]
        public DateTime StartDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        [Required]
        public decimal TotalPrice { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";
    }
}
