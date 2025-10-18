
using HopDong.Domain.Entities;
using HopDong.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HopDong.APIs.BackgroundServices
{
    public class HopDongExpirationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<HopDongExpirationService> _logger;

        public HopDongExpirationService(IServiceProvider serviceProvider, ILogger<HopDongExpirationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("HopDong Expiration Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("HopDong Expiration Service is running.");

                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    var expiredContracts = await dbContext.HopDongThueXes
                        .Where(h => h.Status == HopDongStatus.Signed && h.NgayHetHan < DateTime.UtcNow)
                        .ToListAsync(stoppingToken);

                    if (expiredContracts.Any())
                    {
                        foreach (var contract in expiredContracts)
                        {
                            contract.Status = HopDongStatus.Expired;
                        }
                        await dbContext.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation($"Updated {expiredContracts.Count} contracts to Expired status.");
                    }
                }

                // Chờ 24 giờ cho lần chạy tiếp theo
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
