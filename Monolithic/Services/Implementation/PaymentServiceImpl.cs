using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.DTOs.Payment;
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

        // 1️⃣ Create payment (Deposit, Extra, Refund)
        public async Task<Payment> CreatePaymentAsync(CreatePaymentDto dto)
        {
            var booking = await _dbContext.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == dto.BookingId);

            if (booking == null)
                throw new Exception("Booking not found");

            // Require contract to be created and confirmed for this booking
            var contract = await _dbContext.Contracts
                .FirstOrDefaultAsync(c => c.BookingId == dto.BookingId && !c.IsDeleted);

            if (contract == null || !contract.IsConfirmed)
                throw new InvalidOperationException("Contract not found or not confirmed for this booking");                

            // prevent duplicate same-type payment
            var existing = await _dbContext.Payments
                .FirstOrDefaultAsync(p => p.BookingId == dto.BookingId && p.PaymentType == dto.PaymentType);

            if (existing != null)
                return existing;

            decimal amount = dto.PaymentType switch
            {
                PaymentType.Deposit => booking.DepositAmount,
                PaymentType.Rental => booking.TotalAmount,
                PaymentType.Extra => booking.LateFee + booking.DamageFee, // ✅ use only late + damage
                PaymentType.Refund => booking.RefundAmount,               // ✅ just record refund, no QR
                _ => throw new Exception("Invalid payment type")
            };

            if (dto.PaymentType != PaymentType.Refund && amount <= 0)
                throw new Exception($"No payment required for type {dto.PaymentType}");

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = booking.BookingId,
                Amount = Math.Round(amount, 2),
                PaymentType = dto.PaymentType,
                Description = dto.Description ?? $"{dto.PaymentType} for booking {booking.BookingId}",
                PaymentStatus = dto.PaymentType == PaymentType.Refund
                    ? PaymentStatus.Success  // ✅ Refunds are auto-success (manual handling)
                    : PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Payments.AddAsync(payment);

            // Update booking if refund
            if (dto.PaymentType == PaymentType.Refund)
            {
                booking.BookingStatus = BookingStatus.Completed;
                booking.IsActive = false;
                booking.DepositRefunded = true;
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();
            return payment;
        }

        // 2️⃣ Update payment status
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

            if (status == PaymentStatus.Success)
            {
                var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == payment.BookingId);
                if (booking != null)
                {
                    switch (payment.PaymentType)
                    {
                        case PaymentType.Deposit:
                            booking.BookingStatus = BookingStatus.DepositPaid;
                            break;

                        case PaymentType.Rental:
                            booking.BookingStatus = BookingStatus.CheckedIn;
                            break;

                        case PaymentType.Extra:
                            booking.BookingStatus = BookingStatus.CheckedOut;
                            booking.IsActive = false;
                            break;

                        case PaymentType.Refund:
                            booking.BookingStatus = BookingStatus.Completed;
                            booking.IsActive = false;
                            booking.DepositRefunded = true;
                            break;
                    }

                    booking.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _dbContext.SaveChangesAsync();
            return payment;
        }

        // 3️⃣ Get single payment
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

        // 5️⃣ Total amount paid (successful only)
        public async Task<decimal> GetTotalAmountPaidByBookingAsync(Guid bookingId)
        {
            return await _dbContext.Payments
                .Where(p => p.BookingId == bookingId && p.PaymentStatus == PaymentStatus.Success)
                .SumAsync(p => p.Amount);
        }

        // 6️⃣ All payments by user
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

        // Station Payment Methods
        public async Task<StationPaymentResponseDto> RecordStationDepositAsync(RecordDepositDto request, Guid staffId)
        {
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == request.BookingId);
            if (booking == null)
                throw new ArgumentException("Booking not found");

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = request.BookingId,
                Amount = request.Amount,
                PaymentType = PaymentType.Deposit,
                PaymentStatus = PaymentStatus.Success,
                TransactionId = request.ReferenceCode ?? $"STATION-DEP-{DateTime.UtcNow:yyyyMMddHHmmss}",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Payments.Add(payment);

            // Cập nhật booking status
            if (booking.BookingStatus == BookingStatus.Pending)
            {
                booking.BookingStatus = BookingStatus.DepositPaid;
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();

            return new StationPaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                BookingId = payment.BookingId,
                PaymentType = payment.PaymentType,
                Amount = payment.Amount,
                PaymentMethod = request.PaymentMethod,
                Status = payment.PaymentStatus,
                ReferenceCode = payment.TransactionId,
                RecordedAt = payment.PaidAt ?? DateTime.UtcNow,
                RecordedByStaffId = staffId,
                Notes = request.Notes
            };
        }

        public async Task<StationPaymentResponseDto> RecordStationRefundAsync(RecordRefundDto request, Guid staffId)
        {
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == request.BookingId);
            if (booking == null)
                throw new ArgumentException("Booking not found");

            // Cập nhật các phí
            booking.LateFee = request.LateFee;
            booking.DamageFee = request.DamageFee;

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = request.BookingId,
                Amount = request.RefundAmount,
                PaymentType = PaymentType.Refund,
                PaymentStatus = PaymentStatus.Success,
                TransactionId = $"STATION-REF-{DateTime.UtcNow:yyyyMMddHHmmss}",
                RefundReason = request.RefundReason,
                RefundedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Payments.Add(payment);

            // Đánh dấu đã hoàn cọc
            booking.DepositRefunded = true;
            booking.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return new StationPaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                BookingId = payment.BookingId,
                PaymentType = payment.PaymentType,
                Amount = payment.Amount,
                PaymentMethod = request.PaymentMethod,
                Status = payment.PaymentStatus,
                ReferenceCode = payment.TransactionId,
                RecordedAt = payment.RefundedAt ?? DateTime.UtcNow,
                RecordedByStaffId = staffId,
                Notes = request.Notes
            };
        }

        public async Task<StationPaymentResponseDto> RecordStationPaymentAsync(RecordStationPaymentDto request, Guid staffId)
        {
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.BookingId == request.BookingId);
            if (booking == null)
                throw new ArgumentException("Booking not found");

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = request.BookingId,
                Amount = request.Amount,
                PaymentType = request.PaymentType,
                PaymentStatus = PaymentStatus.Success,
                TransactionId = request.ReferenceCode ?? $"STATION-PAY-{DateTime.UtcNow:yyyyMMddHHmmss}",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Payments.Add(payment);

            // Cập nhật booking status dựa trên loại payment
            if (request.PaymentType == PaymentType.Rental)
            {
                if (booking.BookingStatus == BookingStatus.CheckedOut || 
                    booking.BookingStatus == BookingStatus.CheckedOutPendingPayment)
                {
                    booking.BookingStatus = BookingStatus.Completed;
                }
            }

            booking.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return new StationPaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                BookingId = payment.BookingId,
                PaymentType = payment.PaymentType,
                Amount = payment.Amount,
                PaymentMethod = request.PaymentMethod,
                Status = payment.PaymentStatus,
                ReferenceCode = payment.TransactionId,
                RecordedAt = payment.PaidAt ?? DateTime.UtcNow,
                RecordedByStaffId = staffId,
                Notes = request.Notes
            };
        }
    }
}
