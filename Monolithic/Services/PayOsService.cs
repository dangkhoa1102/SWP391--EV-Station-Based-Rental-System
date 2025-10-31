

using Monolithic.Models;
using Net.payOS;
using Net.payOS.Types;
namespace Monolithic.Services
{
    public class PayOSService
    {
        private readonly PayOS _payOS;

        public PayOSService(IConfiguration configuration)
        {
            _payOS = new PayOS(
                configuration["PayOS:ClientId"] ?? throw new Exception("Missing PAYOS_CLIENT_ID"),
                configuration["PayOS:ApiKey"] ?? throw new Exception("Missing PAYOS_API_KEY"),
                configuration["PayOS:ChecksumKey"] ?? throw new Exception("Missing PAYOS_CHECKSUM_KEY")
            );
        }

        public async Task<(string checkoutUrl, string qrCode, long orderCode)> GeneratePaymentQR(Payment payment)
        {
            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var items = new List<ItemData>
        {
            new ItemData("Booking payment", 1, (int)payment.Amount) // cast decimal -> int
        };

            var paymentData = new PaymentData(
                orderCode,
                (int)payment.Amount,
                "Booking payment",
                items,
                "https://localhost:3000/payment-cancel",
                "https://localhost:3000/payment-success"
            );

            CreatePaymentResult result = await _payOS.createPaymentLink(paymentData);

            return (result.checkoutUrl, result.qrCode, orderCode);
        }

        public async Task<PaymentLinkInformation> GetPaymentLinkInformation(long orderCode)
        {
            return await _payOS.getPaymentLinkInformation(orderCode);
        }
    }
}