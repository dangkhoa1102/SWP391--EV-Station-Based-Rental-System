//using Monolithic.Models;
//using System.Linq.Expressions;

//namespace Monolithic.Repositories.Interfaces
//{
//    public interface IPaymentRepository
//    {
//        // Basic CRUD operations
//        Task<Payment?> GetByIdAsync(Guid paymentId);
//        Task<Payment?> GetByTransactionIdAsync(string transactionId);
//        Task<IEnumerable<Payment>> GetAllAsync();
//        Task<Payment> AddAsync(Payment payment);
//        Task<Payment> UpdateAsync(Payment payment);
//        Task<bool> DeleteAsync(Guid paymentId);
//        Task<bool> ExistsAsync(Guid paymentId);

//        // Query operations
//        Task<IEnumerable<Payment>> FindAsync(Expression<Func<Payment, bool>> predicate);
//        Task<IEnumerable<Payment>> GetByBookingIdAsync(Guid bookingId);
//        Task<IEnumerable<Payment>> GetByUserIdAsync(Guid userId);
        
//        Task<IEnumerable<Payment>> GetByPaymentStatusAsync(PaymentStatus paymentStatus);
//        Task<IEnumerable<Payment>> GetByDateRangeAsync(DateTime fromDate, DateTime toDate);
//        Task<IEnumerable<Payment>> GetExpiredPaymentsAsync();
//        Task<IEnumerable<Payment>> GetPendingPaymentsAsync();

//        // Pagination
//        Task<(IEnumerable<Payment> Items, int TotalCount)> GetPagedAsync(
//            Expression<Func<Payment, bool>>? predicate = null,
//            int page = 1,
//            int pageSize = 10,
//            string? orderBy = null,
//            bool ascending = true);

//        // Statistics
//        Task<decimal> GetTotalAmountByBookingAsync(Guid bookingId);
//        Task<decimal> GetTotalAmountByUserAsync(Guid userId);
//        Task<decimal> GetTotalAmountByDateRangeAsync(DateTime fromDate, DateTime toDate);
//        Task<int> GetCountByStatusAsync(PaymentStatus status);
      

//        // Complex queries
//        Task<IEnumerable<Payment>> GetSuccessfulPaymentsByBookingAsync(Guid bookingId);
//        Task<Payment?> GetLatestPaymentByBookingAsync(Guid bookingId);
//        Task<IEnumerable<Payment>> GetRefundablePaymentsAsync();
//        Task<IEnumerable<Payment>> SearchPaymentsAsync(string searchTerm);
//    }
//}
