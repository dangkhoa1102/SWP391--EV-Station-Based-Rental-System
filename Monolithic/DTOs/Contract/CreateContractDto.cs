namespace Monolithic.DTOs.Contract
{
    public class CreateContractDto
    {
        public Guid BookingId { get; set; }
        public Guid RenterId { get; set; }
        public Guid? StaffId { get; set; }
        public string ContractContent { get; set; } = string.Empty;
        // Optional typed signature (e.g. full name)
        public string? SignatureValue { get; set; }
        // If using email confirmation flow, the email to send confirmation to
        public string? SignerEmail { get; set; }
    }
}
