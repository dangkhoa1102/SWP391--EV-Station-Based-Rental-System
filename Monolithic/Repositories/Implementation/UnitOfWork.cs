using Monolithic.Data;
using Monolithic.Repositories.Interfaces;

namespace Monolithic.Repositories.Implementation
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly EVStationBasedRentalSystemDbContext _context;
        public UnitOfWork(EVStationBasedRentalSystemDbContext context) { _context = context; }

        public ICarRepository Cars => throw new NotImplementedException();

        public IStationRepository Stations => throw new NotImplementedException();

        public IBookingRepository Bookings => throw new NotImplementedException();

        public IFeedbackRepository Feedbacks => throw new NotImplementedException();

        public Task BeginTransactionAsync()
        {
            throw new NotImplementedException();
        }

        public Task CommitTransactionAsync()
        {
            throw new NotImplementedException();
        }

        public void Dispose()
        {
            throw new NotImplementedException();
        }

        public Task RollbackTransactionAsync()
        {
            throw new NotImplementedException();
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }

        public Task<int> SaveChangesAsync()
        {
            throw new NotImplementedException();
        }
    }
}
