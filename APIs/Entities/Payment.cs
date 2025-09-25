using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace APIs.Entities
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int BookingId { get; set; }
        [ForeignKey("BookingId")]
        public Booking Booking { get; set; }

        [Required]
        public decimal Amount { get; set; }   // Số tiền thanh toán

        [Required]
        [MaxLength(50)]
        public string Method { get; set; }   // Ví dụ: "CreditCard", "Cash", "VNPay", ...

        [Required]
        [MaxLength(20)]
        public string Status { get; set; }   // "Pending", "Completed", "Failed"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
