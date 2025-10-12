namespace Monolithic.Repositories.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        ICarRepository Cars { get; }
        IStationRepository Stations { get; }
        IBookingRepository Bookings { get; }
        IFeedbackRepository Feedbacks { get; }
        
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}