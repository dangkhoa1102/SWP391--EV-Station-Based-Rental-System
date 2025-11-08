using Microsoft.Extensions.Hosting;
using Monolithic.Services.Interfaces;

public class BookingAutoCancelService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;

    public BookingAutoCancelService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();

                await bookingService.AutoExpirePendingBookingsAsync();
                await bookingService.AutoCancelNoShowBookingsAsync();
            }

            // Chờ 10 phút trước khi chạy lại
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
