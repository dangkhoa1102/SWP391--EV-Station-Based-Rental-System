using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services
{
    public class PaymentServiceImpl : IPaymentService
    {
        private readonly EVStationBasedRentalSystemDbContext _dbContext;

        public PaymentServiceImpl(EVStationBasedRentalSystemDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // 1️⃣ Create a payment for a booking
        public async Task<Payment> CreatePaymentAsync(Guid bookingId, PaymentType type = PaymentType.Deposit)
        {
            // Check if payment already exists for this booking & type
            var existingPayment = await _dbContext.Payments
                .FirstOrDefaultAsync(p => p.BookingId == bookingId && p.PaymentType == type);

            if (existingPayment != null)
                return existingPayment; // or throw if preferred

            // Get booking info
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (booking == null)
                throw new Exception("Booking not found");

            // Determine payment amount
            decimal amount = type switch
            {
                PaymentType.Deposit => booking.DepositAmount,
                PaymentType.Rental => booking.TotalAmount, // full rental price
                PaymentType.Refund => booking.DepositAmount,
                _ => booking.DepositAmount
            };

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = amount,
                PaymentType = type,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Payments.Add(payment);
            await _dbContext.SaveChangesAsync();

            // Optional: trigger PayOS QR/link generation here
            // var (checkoutUrl, qrCode, orderCode) = await _payOSService.GeneratePaymentQR(payment);
            // payment.OrderCode = orderCode;
            // await _dbContext.SaveChangesAsync();

            return payment;
        }

        // 2️⃣ Update payment status & update booking status automatically
        // Update payment status & update booking status automatically
        public async Task<Payment?> UpdatePaymentStatusAsync(Guid paymentId, PaymentStatus status, string? transactionId = null, string? reason = null)
        {
            var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId);
            if (payment == null) return null;

            payment.PaymentStatus = status;
            if (!string.IsNullOrEmpty(transactionId))
                payment.TransactionId = transactionId;
            if (!string.IsNullOrEmpty(reason))
                payment.RefundReason = reason;

            payment.UpdatedAt = DateTime.UtcNow;

            // Update booking status if payment succeeded
            if (status == PaymentStatus.Success)
            {
                var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == payment.BookingId);
                if (booking != null)
                {
                    switch (payment.PaymentType)
                    {
                        case PaymentType.Deposit:
                            // If deposit succeeds AND check-in was already done, mark as CheckedIn
                            if (booking.BookingStatus == BookingStatus.Pending)
                                booking.BookingStatus = BookingStatus.DepositPaid;

                            else if (booking.BookingStatus == BookingStatus.CheckedInPendingPayment)
                                booking.BookingStatus = BookingStatus.CheckedIn; // ✅ move to active check-in
                            break;

                        case PaymentType.Rental:
                            if (booking.BookingStatus == BookingStatus.CheckedInPendingPayment || booking.BookingStatus == BookingStatus.CheckedIn)
                                booking.BookingStatus = BookingStatus.Completed; // full payment done
                            break;

                        case PaymentType.Refund:
                            booking.BookingStatus = BookingStatus.Cancelled;
                            break;
                    }

                    booking.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _dbContext.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment?> GetPaymentByIdAsync(Guid paymentId)
        {
            return await _dbContext.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        }

        // 4️⃣ Get all payments for a booking
        public async Task<IEnumerable<Payment>> GetPaymentsByBookingIdAsync(Guid bookingId)
        {
            return await _dbContext.Payments
                .Where(p => p.BookingId == bookingId)
                .ToListAsync();
        }

        // 5️⃣ Get total amount paid for a booking
        public async Task<decimal> GetTotalAmountPaidByBookingAsync(Guid bookingId)
        {
            return await _dbContext.Payments
                .Where(p => p.BookingId == bookingId && p.PaymentStatus == PaymentStatus.Success)
                .SumAsync(p => p.Amount);
        }

        // 6️⃣ Get payments by user
        public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(Guid userId)
        {
            return await _dbContext.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.UserId == userId)
                .ToListAsync();
        }

        public Task<decimal> GetTotalAmountByBookingAsync(Guid bookingId)
        {
            throw new NotImplementedException();
        }
    }
}
