using Monolithic.Models;
using Microsoft.Extensions.Options;
using Net.payOS;
using Net.payOS.Types;

namespace Monolithic.Services
{
    public class PayOSService
    {
        private readonly PayOS _payOS;

        public PayOSService(IOptions<PayOSSettings> payOSSettings)
        {
            var settings = payOSSettings.Value;
            
            if (string.IsNullOrEmpty(settings.ClientId))
                throw new InvalidOperationException("PayOS ClientId is not configured. Make sure CLIENT_ID environment variable is set.");
            if (string.IsNullOrEmpty(settings.ApiKey))
                throw new InvalidOperationException("PayOS ApiKey is not configured. Make sure API_KEY environment variable is set.");
            if (string.IsNullOrEmpty(settings.ChecksumKey))
                throw new InvalidOperationException("PayOS ChecksumKey is not configured. Make sure CHECKSUM_KEY environment variable is set.");

            _payOS = new PayOS(settings.ClientId, settings.ApiKey, settings.ChecksumKey);
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
               "http://localhost:5173/payment-cancel",
                "http://localhost:5173/payment-success"
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