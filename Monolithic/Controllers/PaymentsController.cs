using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Payment;
using Monolithic.Models;
using Monolithic.Services;
using Monolithic.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly PayOSService _payOSService;

    public PaymentController(IPaymentService paymentService, PayOSService payOSService)
    {
        _paymentService = paymentService;
        _payOSService = payOSService;
    }

 



        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto request)
        {
        var payment = await _paymentService.CreatePaymentAsync(request);

        // Generate PayOS QR/checkout
        var (checkoutUrl, qrCode, orderCode) = await _payOSService.GeneratePaymentQR(payment);

            payment.OrderCode = orderCode;
            await _paymentService.UpdatePaymentStatusAsync(payment.PaymentId, PaymentStatus.Pending);

            var dto = new PaymentDto
            {
                PaymentId = payment.PaymentId,
                BookingId = payment.BookingId,
                Amount = payment.Amount,
                PaymentStatus = payment.PaymentStatus,
                PaymentType = payment.PaymentType,
                OrderCode = orderCode,
                CheckoutUrl = checkoutUrl,
                QrCode = qrCode,
                CreatedAt = payment.CreatedAt,
                UpdatedAt = payment.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpPost("sync/{bookingId}")]
        public async Task<IActionResult> SyncPaymentStatus(Guid bookingId)
        {
            var payments = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);
            foreach (var payment in payments)
            {
                var info = await _payOSService.GetPaymentLinkInformation(payment.OrderCode);
                if (info.status == "PAID" && payment.PaymentStatus != PaymentStatus.Success)
                {
                    await _paymentService.UpdatePaymentStatusAsync(payment.PaymentId, PaymentStatus.Success,
                        info.transactions.FirstOrDefault()?.reference);

                    // Optionally update booking status
                    // await _bookingService.UpdateBookingStatusAsync(payment.BookingId, "Confirmed");
                }
            }

            return Ok(payments.Select(p => new { p.PaymentId, p.PaymentStatus, p.TransactionId }));
        }

        [HttpGet("{bookingId}/status")]
        public async Task<IActionResult> GetStatus(Guid bookingId)
        {
            var payments = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);
            return Ok(payments.Select(p => new { p.PaymentId, p.PaymentStatus, p.TransactionId }));
        }
    }


    public class PaymentRequest
{
    public Guid BookingId { get; set; }
}
