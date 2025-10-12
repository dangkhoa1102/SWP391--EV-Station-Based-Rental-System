
using EVStation_basedRentalSystem.IncidentAPI.Data;
using IncidentAPI.Services;
using IncidentAPI.Services.IServices;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.IncidentAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Database Context
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Services
            builder.Services.AddScoped<IIncidentService, IncidentService>();

            // Ho?c thêm static files configuration
            builder.Environment.WebRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // Thêm static files ?? ph?c v? ?nh upload
            app.UseStaticFiles();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
