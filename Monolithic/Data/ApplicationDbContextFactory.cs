using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Monolithic.Data;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<EVStationBasedRentalSystemDbContext>
{
    public EVStationBasedRentalSystemDbContext CreateDbContext(string[] args)
    {
        // Đường dẫn tới appsettings.json
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory()) // quan trọng: đảm bảo đọc đúng file
            .AddJsonFile("appsettings.json")
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        var optionsBuilder = new DbContextOptionsBuilder<EVStationBasedRentalSystemDbContext>();
        // UseSqlServer extension method is defined in Microsoft.EntityFrameworkCore.SqlServer
        optionsBuilder.UseSqlServer(connectionString);

        return new EVStationBasedRentalSystemDbContext(optionsBuilder.Options);
    }
}
