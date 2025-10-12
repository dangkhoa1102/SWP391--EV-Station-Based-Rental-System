using EVStation_basedRentalSystem.Services.BookingAPI.Data;
using EVStation_basedRentalSystem.Services.BookingAPI.Repository;
using EVStation_basedRentalSystem.Services.BookingAPI.Repository.IRepository;
using EVStation_basedRentalSystem.Services.BookingAPI.Services;
using EVStation_basedRentalSystem.Services.BookingAPI.Services.IService;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<IBookingRepository, BookingRepository>();

// Register services
builder.Services.AddScoped<IBookingService, BookingService>();

// Add HttpClient for inter-service communication
builder.Services.AddHttpClient();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "EV Station Booking API",
        Version = "v1",
        Description = "API for managing car rental bookings in EV Station-Based Rental System"
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Booking API V1");
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
