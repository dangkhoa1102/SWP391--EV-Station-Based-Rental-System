using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Monolithic.Data;
using Monolithic.Services.Interfaces;
using Monolithic.Repositories.Interfaces;
using Monolithic.Repositories.Implementation;
using Monolithic.Services.Implementation;
using Monolithic.Mappings;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database configuration
builder.Services.AddDbContext<EVStationBasedRentalSystemDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Repository pattern - Using separate implementation classes
builder.Services.AddScoped<IStationRepository, StationRepositoryImpl>();
builder.Services.AddScoped<ICarRepository, CarRepositoryImpl>();
builder.Services.AddScoped<IBookingRepository, BookingRepositoryImpl>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepositoryImpl>();
builder.Services.AddScoped<IContractRepository, ContractRepositoryImpl>();

// Services - Using separate implementation classes
builder.Services.AddScoped<IStationService, StationServiceImpl>();
builder.Services.AddScoped<ICarService, CarServiceImpl>();
builder.Services.AddScoped<IBookingService, BookingServiceImpl>();
builder.Services.AddScoped<IFeedbackService, FeedbackServiceImpl>();
// Services
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IContractService, ContractServiceImpl>();
builder.Services.AddScoped<IContractService, ContractServiceImpl>();

// Custom User Service
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Monolithic API V1");
        options.RoutePrefix = "swagger"; // Swagger UI will be at /swagger
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-open browser in development
if (app.Environment.IsDevelopment())
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var urls = app.Urls;
        if (urls.Any())
        {
            var httpsUrl = urls.FirstOrDefault(u => u.StartsWith("https")) ?? urls.First();
            var swaggerUrl = $"{httpsUrl}/swagger";
            logger.LogInformation("Opening Swagger UI at: {SwaggerUrl}", swaggerUrl);
            
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = swaggerUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                logger.LogWarning("Could not automatically open browser: {Error}", ex.Message);
                logger.LogInformation("Please manually navigate to: {SwaggerUrl}", swaggerUrl);
            }
        }
    });
}

app.Run();
