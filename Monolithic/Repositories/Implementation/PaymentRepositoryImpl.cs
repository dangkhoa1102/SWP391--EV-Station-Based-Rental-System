using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using System.Linq.Expressions;

namespace Monolithic.Repositories.Implementation
{
    public class PaymentRepositoryImpl : IPaymentRepository
    {
        private readonly EVStationBasedRentalSystemDbContext _context;

        public PaymentRepositoryImpl(EVStationBasedRentalSystemDbContext context)
        {
            _context = context;
        }

        public async Task<Payment?> GetByIdAsync(Guid paymentId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId && p.IsActive);
        }

        public async Task<Payment?> GetByTransactionIdAsync(string transactionId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.TransactionId == transactionId && p.IsActive);
        }

        public async Task<IEnumerable<Payment>> GetAllAsync()
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Payment> AddAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment> UpdateAsync(Payment payment)
        {
            payment.UpdatedAt = DateTime.UtcNow;
            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<bool> DeleteAsync(Guid paymentId)
        {
            var payment = await GetByIdAsync(paymentId);
            if (payment == null) return false;

            payment.IsActive = false;
            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid paymentId)
        {
            return await _context.Payments
                .AnyAsync(p => p.PaymentId == paymentId && p.IsActive);
        }

        public async Task<IEnumerable<Payment>> FindAsync(Expression<Func<Payment, bool>> predicate)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.IsActive)
                .Where(predicate)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByBookingIdAsync(Guid bookingId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.BookingId == bookingId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.UserId == userId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByPaymentMethodAsync(PaymentMethod paymentMethod)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.PaymentMethod == paymentMethod && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByPaymentStatusAsync(PaymentStatus paymentStatus)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.PaymentStatus == paymentStatus && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByDateRangeAsync(DateTime fromDate, DateTime toDate)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.CreatedAt >= fromDate && p.CreatedAt <= toDate && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetExpiredPaymentsAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.ExpiredAt.HasValue && p.ExpiredAt < now && 
                           p.PaymentStatus == PaymentStatus.Pending && p.IsActive)
                .OrderBy(p => p.ExpiredAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetPendingPaymentsAsync()
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.PaymentStatus == PaymentStatus.Pending && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Payment> Items, int TotalCount)> GetPagedAsync(
            Expression<Func<Payment, bool>>? predicate = null,
            int page = 1,
            int pageSize = 10,
            string? orderBy = null,
            bool ascending = true)
        {
            var query = _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.IsActive);

            if (predicate != null)
            {
                query = query.Where(predicate);
            }

            var totalCount = await query.CountAsync();

            // Apply ordering
            if (!string.IsNullOrEmpty(orderBy))
            {
                var property = typeof(Payment).GetProperty(orderBy);
                if (property != null)
                {
                    var parameter = Expression.Parameter(typeof(Payment), "p");
                    var propertyAccess = Expression.MakeMemberAccess(parameter, property);
                    var lambda = Expression.Lambda(propertyAccess, parameter);

                    var methodName = ascending ? "OrderBy" : "OrderByDescending";
                    var resultExpression = Expression.Call(
                        typeof(Queryable),
                        methodName,
                        new Type[] { typeof(Payment), property.PropertyType },
                        query.Expression,
                        lambda);

                    query = query.Provider.CreateQuery<Payment>(resultExpression);
                }
            }
            else
            {
                query = query.OrderByDescending(p => p.CreatedAt);
            }

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<decimal> GetTotalAmountByBookingAsync(Guid bookingId)
        {
            return await _context.Payments
                .Where(p => p.BookingId == bookingId && 
                           p.PaymentStatus == PaymentStatus.Success && 
                           p.IsActive)
                .SumAsync(p => p.Amount);
        }

        public async Task<decimal> GetTotalAmountByUserAsync(Guid userId)
        {
            return await _context.Payments
                .Where(p => p.Booking.UserId == userId && 
                           p.PaymentStatus == PaymentStatus.Success && 
                           p.IsActive)
                .SumAsync(p => p.Amount);
        }

        public async Task<decimal> GetTotalAmountByDateRangeAsync(DateTime fromDate, DateTime toDate)
        {
            return await _context.Payments
                .Where(p => p.CreatedAt >= fromDate && 
                           p.CreatedAt <= toDate && 
                           p.PaymentStatus == PaymentStatus.Success && 
                           p.IsActive)
                .SumAsync(p => p.Amount);
        }

        public async Task<int> GetCountByStatusAsync(PaymentStatus status)
        {
            return await _context.Payments
                .CountAsync(p => p.PaymentStatus == status && p.IsActive);
        }

        public async Task<int> GetCountByMethodAsync(PaymentMethod method)
        {
            return await _context.Payments
                .CountAsync(p => p.PaymentMethod == method && p.IsActive);
        }

        public async Task<IEnumerable<Payment>> GetSuccessfulPaymentsByBookingAsync(Guid bookingId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.BookingId == bookingId && 
                           p.PaymentStatus == PaymentStatus.Success && 
                           p.IsActive)
                .OrderByDescending(p => p.ProcessedAt)
                .ToListAsync();
        }

        public async Task<Payment?> GetLatestPaymentByBookingAsync(Guid bookingId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.BookingId == bookingId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Payment>> GetRefundablePaymentsAsync()
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.PaymentStatus == PaymentStatus.Success && 
                           !p.RefundedAt.HasValue && 
                           p.IsActive)
                .OrderByDescending(p => p.ProcessedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> SearchPaymentsAsync(string searchTerm)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.IsActive && (
                    p.TransactionId.Contains(searchTerm) ||
                    p.GatewayTransactionId!.Contains(searchTerm) ||
                    p.Description!.Contains(searchTerm) ||
                    p.BookingId.ToString().Contains(searchTerm)
                ))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
    }
}
