namespace Monolithic.DTOs.Contract
{
    public class ContractDto
    {
        public Guid ContractId { get; set; }
        public Guid BookingId { get; set; }
        public Guid RenterId { get; set; }
        public Guid? StaffId { get; set; }
        public string ContractContent { get; set; } = string.Empty;
        public string ContractContentHash { get; set; } = string.Empty;
        public string SignatureType { get; set; } = "EmailConfirmation";
        public string? SignatureValue { get; set; }
        public string? SignerEmail { get; set; }
        public bool IsConfirmed { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
