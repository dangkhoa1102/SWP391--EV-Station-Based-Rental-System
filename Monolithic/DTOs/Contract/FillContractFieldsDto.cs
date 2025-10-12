using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Contract
{
    public class FillContractFieldsDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public Guid RenterId { get; set; }

        [Required]
        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        [RegularExpression(@"^[0-9A-Za-z]{5,20}$", ErrorMessage = "IdNumber has invalid format")]
        public string IdNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string? DriverLicenseNumber { get; set; }

        [Required]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        [Required]
        public Guid CarId { get; set; }

        [Range(0, 1000000000)]
        public decimal EstimatedAmount { get; set; }

        [StringLength(1000)]
        public string? AdditionalNotes { get; set; }

        [EmailAddress]
        public string? SignerEmail { get; set; }

        [Required]
        [Range(typeof(bool), "true", "true", ErrorMessage = "AcceptTerms must be true")]
        public bool AcceptTerms { get; set; }    }}
