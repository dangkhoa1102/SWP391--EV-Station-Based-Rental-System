using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
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
        var payment = await _paymentService.CreatePaymentAsync(request.BookingId, request.PaymentType);

        // Generate PayOS QR/checkout
        var (checkoutUrl, qrCode, orderCode) = await _payOSService.GeneratePaymentQR(payment);

        payment.OrderCode = orderCode;
        await _paymentService.UpdatePaymentStatusAsync(payment.PaymentId, PaymentStatus.Pending);

        var dto = new PaymentDto
        {
        var payment = await _paymentService.CreatePaymentAsync(request);

        // Generate PayOS QR/checkout
        var (checkoutUrl, qrCode, orderCode) = await _payOSService.GeneratePaymentQR(payment);

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

    /// <summary>
    /// Ghi nh?n thanh to�n t?i ?i?m b?i Station Staff (Deposit)
    /// </summary>
    [HttpPost("Station/Record-Deposit")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<IActionResult> RecordStationDeposit([FromBody] RecordDepositDto request)
    {
        var staffIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

        try
        {
            var result = await _paymentService.RecordStationDepositAsync(request, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Ghi nh?n ho�n c?c t?i ?i?m b?i Station Staff
    /// </summary>
    [HttpPost("Station/Record-Refund")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<IActionResult> RecordStationRefund([FromBody] RecordRefundDto request)
    {
        var staffIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

        try
        {
            var result = await _paymentService.RecordStationRefundAsync(request, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Ghi nh?n thanh to�n ti?n thu� xe t?i ?i?m
    /// </summary>
    [HttpPost("Station/Record-Rental-Payment")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
    public async Task<IActionResult> RecordStationRentalPayment([FromBody] RecordStationPaymentDto request)
    {
        var staffIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

        try
        {
            var result = await _paymentService.RecordStationPaymentAsync(request, staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}


public class PaymentRequest
{
    public Guid BookingId { get; set; }
}
