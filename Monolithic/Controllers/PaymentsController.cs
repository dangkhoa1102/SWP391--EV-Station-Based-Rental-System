using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Payment;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Services.Interfaces;
using System.Security.Claims;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Create a new payment for a booking
        /// </summary>
        [HttpPost("Create")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> CreatePayment([FromBody] CreatePaymentDto request)
        {
            try
            {
                var result = await _paymentService.CreatePaymentAsync(request);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Process payment through gateway
        /// </summary>
        [HttpPost("Process/{paymentId}")]
        public async Task<ActionResult<ResponseDto<PaymentGatewayResponseDto>>> ProcessPayment(Guid paymentId)
        {
            try
            {
                var result = await _paymentService.ProcessPaymentAsync(paymentId);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment {PaymentId}", paymentId);
                return StatusCode(500, ResponseDto<PaymentGatewayResponseDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Confirm payment after gateway callback
        /// </summary>
        [HttpPost("Confirm")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> ConfirmPayment([FromBody] ConfirmPaymentDto request)
        {
            try
            {
                var result = await _paymentService.ConfirmPaymentAsync(request);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment");
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Cancel a pending payment
        /// </summary>
        [HttpPost("Cancel/{paymentId}")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> CancelPayment(Guid paymentId, [FromQuery] string reason = "Cancelled by user")
        {
            try
            {
                var result = await _paymentService.CancelPaymentAsync(paymentId, reason);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling payment {PaymentId}", paymentId);
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get payment by ID
        /// </summary>
        [HttpGet("{paymentId}")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> GetPaymentById(Guid paymentId)
        {
            try
            {
                var result = await _paymentService.GetPaymentByIdAsync(paymentId);
                if (!result.IsSuccess)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment {PaymentId}", paymentId);
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get payment by transaction ID
        /// </summary>
        [HttpGet("transaction/{transactionId}")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> GetPaymentByTransactionId(string transactionId)
        {
            try
            {
                var result = await _paymentService.GetPaymentByTransactionIdAsync(transactionId);
                if (!result.IsSuccess)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment by transaction ID {TransactionId}", transactionId);
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get all payments for a booking
        /// </summary>
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<ResponseDto<IEnumerable<PaymentDto>>>> GetPaymentsByBookingId(Guid bookingId)
        {
            try
            {
                var result = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payments for booking {BookingId}", bookingId);
                return StatusCode(500, ResponseDto<IEnumerable<PaymentDto>>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get all payments for current user
        /// </summary>
        [HttpGet("my-payments")]
        public async Task<ActionResult<ResponseDto<IEnumerable<PaymentDto>>>> GetMyPayments()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
                {
                    return Unauthorized(ResponseDto<IEnumerable<PaymentDto>>.Failure("User not authenticated"));
                }

                var result = await _paymentService.GetPaymentsByUserIdAsync(userGuid);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user payments");
                return StatusCode(500, ResponseDto<IEnumerable<PaymentDto>>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Search payments with filters
        /// </summary>
        [HttpPost("Search")]
        [Authorize(Roles = "Admin,StationStaff")]
        public async Task<ActionResult<ResponseDto<PagedResult<PaymentDto>>>> SearchPayments([FromBody] PaymentSearchDto searchDto)
        {
            try
            {
                var result = await _paymentService.SearchPaymentsAsync(searchDto);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching payments");
                return StatusCode(500, ResponseDto<PagedResult<PaymentDto>>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Update payment status
        /// </summary>
        [HttpPut("Status/{paymentId}")]
        [Authorize(Roles = "Admin,StationStaff")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> UpdatePaymentStatus(
            Guid paymentId, 
            [FromQuery] PaymentStatus status, 
            [FromQuery] string? reason = null)
        {
            try
            {
                var result = await _paymentService.UpdatePaymentStatusAsync(paymentId, status, reason);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status {PaymentId}", paymentId);
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Refund a payment
        /// </summary>
        [HttpPost("Refund")]
        [Authorize(Roles = "Admin,StationStaff")]
        public async Task<ActionResult<ResponseDto<PaymentDto>>> RefundPayment([FromBody] RefundPaymentDto request)
        {
            try
            {
                var result = await _paymentService.RefundPaymentAsync(request);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refunding payment");
                return StatusCode(500, ResponseDto<PaymentDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get payment statistics
        /// </summary>
        [HttpGet("Statistics")]
        [Authorize(Roles = "Admin,StationStaff")]
        public async Task<ActionResult<ResponseDto<PaymentStatisticsDto>>> GetPaymentStatistics(
            [FromQuery] DateTime? fromDate = null, 
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var result = await _paymentService.GetPaymentStatisticsAsync(fromDate, toDate);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment statistics");
                return StatusCode(500, ResponseDto<PaymentStatisticsDto>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get total amount for a booking
        /// </summary>
        [HttpGet("booking/{bookingId}/total")]
        public async Task<ActionResult<ResponseDto<decimal>>> GetTotalAmountByBooking(Guid bookingId)
        {
            try
            {
                var result = await _paymentService.GetTotalAmountByBookingAsync(bookingId);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting total amount for booking {BookingId}", bookingId);
                return StatusCode(500, ResponseDto<decimal>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get total amount for current user
        /// </summary>
        [HttpGet("my-total")]
        public async Task<ActionResult<ResponseDto<decimal>>> GetMyTotalAmount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
                {
                    return Unauthorized(ResponseDto<decimal>.Failure("User not authenticated"));
                }

                var result = await _paymentService.GetTotalAmountByUserAsync(userGuid);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user total amount");
                return StatusCode(500, ResponseDto<decimal>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Get expired payments
        /// </summary>
        [HttpGet("Expired")]
        [Authorize(Roles = "Admin,StationStaff")]
        public async Task<ActionResult<ResponseDto<IEnumerable<PaymentDto>>>> GetExpiredPayments()
        {
            try
            {
                var result = await _paymentService.GetExpiredPaymentsAsync();
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting expired payments");
                return StatusCode(500, ResponseDto<IEnumerable<PaymentDto>>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Cleanup expired payments
        /// </summary>
        [HttpPost("Cleanup-Expired")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ResponseDto<bool>>> CleanupExpiredPayments()
        {
            try
            {
                var result = await _paymentService.CleanupExpiredPaymentsAsync();
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired payments");
                return StatusCode(500, ResponseDto<bool>.Failure("Internal server error"));
            }
        }

        /// <summary>
        /// Gateway callback endpoint (for external gateways)
        /// </summary>
        [HttpPost("Callback/{gatewayName}")]
        [AllowAnonymous]
        public async Task<ActionResult<ResponseDto<bool>>> PaymentCallback(string gatewayName, [FromForm] Dictionary<string, string> callbackData)
        {
            try
            {
                var result = await _paymentService.VerifyPaymentCallbackAsync(gatewayName, callbackData);
                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment callback from {GatewayName}", gatewayName);
                return StatusCode(500, ResponseDto<bool>.Failure("Internal server error"));
            }
        }
    }
}
