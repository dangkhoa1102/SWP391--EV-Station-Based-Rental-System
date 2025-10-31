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

        // 1️⃣ Create payment (Deposit, Rental, Extra, Refund)
        public async Task<Payment> CreatePaymentAsync(Guid bookingId, PaymentType type = PaymentType.Deposit)
        {
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (booking == null)
                throw new Exception("Booking not found");

            // Avoid duplicates
            var existingPayment = await _dbContext.Payments
                .FirstOrDefaultAsync(p => p.BookingId == bookingId && p.PaymentType == type);

            if (existingPayment != null)
                return existingPayment;

            decimal amount = type switch
            {
                PaymentType.Deposit => booking.DepositAmount, // 30%
                PaymentType.Rental => booking.TotalAmount,    // 100% rental at check-in
                PaymentType.Extra => (booking.LateFee + booking.DamageFee), // Late/damage fee at check-out
                PaymentType.Refund => booking.DepositAmount,  // refund deposit
                _ => 0
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
            return payment;
        }

        // 2️⃣ Update payment status and automatically update booking
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

            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == payment.BookingId);
            if (booking != null && status == PaymentStatus.Success)
            {
                switch (payment.PaymentType)
                {
                    case PaymentType.Deposit:
                        booking.BookingStatus = BookingStatus.DepositPaid;
                        break;

                    case PaymentType.Rental:
                        // Paid full rental → officially checked in
                        booking.BookingStatus = BookingStatus.CheckedIn;
                        break;

                    case PaymentType.Extra:
                        // Paid extra → finalize check-out
                        booking.BookingStatus = BookingStatus.CheckedOut;
                        break;

                    case PaymentType.Refund:
                        // Refund complete → booking finished
                        booking.BookingStatus = BookingStatus.Completed;
                        break;
                }

                booking.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            await _dbContext.SaveChangesAsync();
            return payment;
        }

        // 3️⃣ Retrieve payment
        public async Task<Payment?> GetPaymentByIdAsync(Guid paymentId)
        {
            return await _dbContext.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        }

        // 4️⃣ All payments by booking
        public async Task<IEnumerable<Payment>> GetPaymentsByBookingIdAsync(Guid bookingId)
        {
            return await _dbContext.Payments
                .Where(p => p.BookingId == bookingId)
                .ToListAsync();
        }

        // 5️⃣ Total amount paid
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
