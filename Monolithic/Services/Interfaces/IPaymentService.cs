using Monolithic.DTOs.Payment;
using Monolithic.DTOs.Common;
using Monolithic.Models;

namespace Monolithic.Services.Interfaces
{
    public interface IPaymentService
    {
        // Payment creation and processing
        Task<ResponseDto<PaymentDto>> CreatePaymentAsync(CreatePaymentDto request);
        Task<ResponseDto<PaymentGatewayResponseDto>> ProcessPaymentAsync(Guid paymentId);
        Task<ResponseDto<PaymentDto>> ConfirmPaymentAsync(ConfirmPaymentDto request);
        Task<ResponseDto<PaymentDto>> CancelPaymentAsync(Guid paymentId, string reason);

        // Payment retrieval
        Task<ResponseDto<PaymentDto>> GetPaymentByIdAsync(Guid paymentId);
        Task<ResponseDto<PaymentDto>> GetPaymentByTransactionIdAsync(string transactionId);
        Task<ResponseDto<IEnumerable<PaymentDto>>> GetPaymentsByBookingIdAsync(Guid bookingId);
        Task<ResponseDto<IEnumerable<PaymentDto>>> GetPaymentsByUserIdAsync(Guid userId);
        Task<ResponseDto<PagedResult<PaymentDto>>> SearchPaymentsAsync(PaymentSearchDto searchDto);

        // Payment status management
        Task<ResponseDto<PaymentDto>> UpdatePaymentStatusAsync(Guid paymentId, PaymentStatus status, string? reason = null);
        Task<ResponseDto<PaymentDto>> MarkPaymentAsProcessedAsync(Guid paymentId, string gatewayTransactionId, string? gatewayResponse = null);
        Task<ResponseDto<PaymentDto>> MarkPaymentAsFailedAsync(Guid paymentId, string reason);

        // Refund operations
        Task<ResponseDto<PaymentDto>> RefundPaymentAsync(RefundPaymentDto request);
        Task<ResponseDto<PaymentDto>> ProcessRefundAsync(Guid paymentId, string refundTransactionId);

        // Statistics and reporting
        Task<ResponseDto<PaymentStatisticsDto>> GetPaymentStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
        Task<ResponseDto<decimal>> GetTotalAmountByBookingAsync(Guid bookingId);
        Task<ResponseDto<decimal>> GetTotalAmountByUserAsync(Guid userId);

        // Utility methods
        Task<ResponseDto<IEnumerable<PaymentDto>>> GetExpiredPaymentsAsync();
        Task<ResponseDto<bool>> CleanupExpiredPaymentsAsync();
        Task<ResponseDto<string>> GenerateTransactionIdAsync();

        // Gateway integration
        Task<ResponseDto<PaymentGatewayResponseDto>> CreateVNPayPaymentAsync(CreatePaymentDto request);
        Task<ResponseDto<PaymentGatewayResponseDto>> CreateMoMoPaymentAsync(CreatePaymentDto request);
        Task<ResponseDto<PaymentGatewayResponseDto>> CreateZaloPayPaymentAsync(CreatePaymentDto request);
        Task<ResponseDto<bool>> VerifyPaymentCallbackAsync(string gatewayName, Dictionary<string, string> callbackData);
    }

    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
