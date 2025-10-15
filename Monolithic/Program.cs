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
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "EV Station-based Rental System API",
        Version = "v1",
        Description = "API for EV Station-based Rental System - Monolithic Architecture"
    });

    // Enable XML comments for better API documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Add JWT Authentication to Swagger
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập JWT token vào đây. Ví dụ: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

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

    // Cho phép nhận token từ query string hoặc header mà không cần "Bearer " prefix
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Lấy token từ header Authorization
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader))
            {
                // Nếu có "Bearer " thì loại bỏ
                if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
                else
                {
                    // Nếu không có "Bearer " thì lấy trực tiếp token
                    context.Token = authHeader.Trim();
                }
            }
            // Nếu không có trong header, thử lấy từ query string
            else if (context.Request.Query.TryGetValue("token", out var token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// CORS - Allow frontend to connect
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
    
    // Alternative policy with credentials support (use this if frontend needs to send cookies)
    options.AddPolicy("AllowSpecificOrigins", builder =>
    {
        builder.WithOrigins(
                "http://localhost:3000",      // React default
                "http://localhost:5173",      // Vite default
                "http://localhost:4200",      // Angular default
                "http://localhost:8080",      // Vue default
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:4200",
                "http://127.0.0.1:8080"
               )
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();  // Support credentials (cookies, auth headers)
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
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IContractService, ContractServiceImpl>();
builder.Services.AddScoped<IUserService, UserService>();

// Auth Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenServiceImpl>();
builder.Services.AddScoped<IAuthService, AuthServiceImpl>();

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

// CORS must be before UseHttpsRedirection for proper handling
app.UseCors("AllowAll");

app.UseHttpsRedirection();

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
            var httpUrl = urls.FirstOrDefault(u => u.StartsWith("http://")) ?? urls.First();
            var swaggerUrl = $"{httpUrl}/swagger";
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
