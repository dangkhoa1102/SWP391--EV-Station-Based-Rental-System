using HopDong.Application.Services;
using HopDong.Application.Services.IServices;
using HopDong.Domain.Interfaces;
using HopDong.Infrastructure.Data;
using HopDong.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HopDong.APIs
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            // 1. C?u hình Connection String
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // 2. ??ng ký các l?p ph? thu?c (Dependency Injection)
            builder.Services.AddScoped<IHopDongRepository, HopDongRepository>();
            builder.Services.AddScoped<IHopDongFileService, HopDongFileService>();

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
