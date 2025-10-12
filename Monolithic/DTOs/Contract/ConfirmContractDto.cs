namespace Monolithic.DTOs.Contract
{
    public class ConfirmContractDto
    {
        public Guid ContractId { get; set; }
        public string Token { get; set; } = string.Empty;
    }
}
