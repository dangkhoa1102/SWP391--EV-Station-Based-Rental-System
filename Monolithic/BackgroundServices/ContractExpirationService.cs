using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.Models;

namespace Monolithic.BackgroundServices;

public class ContractExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ContractExpirationService> _logger;

    public ContractExpirationService(IServiceProvider serviceProvider, ILogger<ContractExpirationService> logger)
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
                var dbContext = scope.ServiceProvider.GetRequiredService<EVStationBasedRentalSystemDbContext>();

                var expiredContracts = await dbContext.Contracts
                    .Where(h => h.Status == ContractStatus.Signed && h.NgayHetHan < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                if (expiredContracts.Any())
                {
                    foreach (var contract in expiredContracts)
                    {
                        contract.Status = ContractStatus.Expired;
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
