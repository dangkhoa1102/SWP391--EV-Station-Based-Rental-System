using Monolithic.DTOs.Payment;
using Monolithic.Models;

namespace Monolithic.Services.Interfaces
{
    public interface IPaymentService
    {
        // Create a payment for a booking
        Task<Payment> CreatePaymentAsync(CreatePaymentDto dto);

        // Sync or update payment status (e.g., after PayOS callback)
        Task<Payment?> UpdatePaymentStatusAsync(Guid paymentId, PaymentStatus status, string? transactionId = null, string? reason = null);

        // Get payment by ID
        Task<Payment?> GetPaymentByIdAsync(Guid paymentId);

        // Get all payments for a booking
        Task<IEnumerable<Payment>> GetPaymentsByBookingIdAsync(Guid bookingId);

        // Optional: get total amount paid for a booking
        Task<decimal> GetTotalAmountByBookingAsync(Guid bookingId);

        // Optional: get payments by user
        Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(Guid userId);
        Task<decimal> GetStationRevenueAsync(Guid stationId, DateTime? from = null, DateTime? to = null);

        // Station Staff payment methods
        Task<StationPaymentResponseDto> RecordStationDepositAsync(RecordDepositDto request, Guid staffId);
        Task<StationPaymentResponseDto> RecordStationRefundAsync(RecordRefundDto request, Guid staffId);
        Task<StationPaymentResponseDto> RecordStationPaymentAsync(RecordStationPaymentDto request, Guid staffId);
    }
}
