using HopDong.APIs.BackgroundServices;
using HopDong.Application.Services;
using HopDong.Application.Services.IServices;
using HopDong.Domain.Interfaces;
using HopDong.Infrastructure.Data;
using HopDong.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using DotNetEnv;

namespace HopDong.APIs
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Load environment variables from .env file
            Env.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
            
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            // 1. Configuare Connection String
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // 2. Dependency Injection
            builder.Services.AddScoped<IHopDongRepository, HopDongRepository>();
            //builder.Services.AddScoped<IHopDongFileService, HopDongFileService>();
            builder.Services.AddScoped<IHopDongService, HopDongService>();
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Service for background task
            builder.Services.AddHostedService<HopDongExpirationService>();


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
