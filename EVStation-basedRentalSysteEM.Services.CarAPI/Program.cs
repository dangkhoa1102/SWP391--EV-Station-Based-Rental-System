using EVStation_basedRentalSystem.Services.CarAPI.Clients;
using EVStation_basedRentalSystem.Services.CarAPI.Data;
using EVStation_basedRentalSystem.Services.CarAPI.Repository;
using EVStation_basedRentalSystem.Services.CarAPI.Repository.IRepository;
using EVStation_basedRentalSystem.Services.CarAPI.Services;
using EVStation_basedRentalSystem.Services.CarAPI.Services.IService;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Database Configuration
builder.Services.AddDbContext<CarDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// HTTP Client for StationAPI
builder.Services.AddHttpClient<IStationClient, StationClient>(client =>
{
    var stationApiUrl = builder.Configuration["ServiceUrls:StationAPI"];
    client.BaseAddress = new Uri(stationApiUrl ?? "https://localhost:7001");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Dependency Injection
builder.Services.AddScoped<ICarRepository, CarRepository>();
builder.Services.AddScoped<ICarService, CarService>();

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Car API",
        Version = "v1",
        Description = "API for managing electric vehicles in the EV Station-based Rental System"
    });
});

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
