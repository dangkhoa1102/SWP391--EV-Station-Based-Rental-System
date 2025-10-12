using EVStation_basedRendtalSystem.Services.StationAPI.Data;
using EVStation_basedRendtalSystem.Services.StationAPI.Repository;
using EVStation_basedRendtalSystem.Services.StationAPI.Repository.IRepository;
using EVStation_basedRendtalSystem.Services.StationAPI.Services;
using EVStation_basedRendtalSystem.Services.StationAPI.Services.IService;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------
// 1️⃣ Configure DbContext
// ----------------------------
builder.Services.AddDbContext<StationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ----------------------------
// 2️⃣ Register Repository
// ----------------------------
builder.Services.AddScoped<IStationRepository, StationRepository>();

// ----------------------------
// 3️⃣ Register Service
// ----------------------------
builder.Services.AddScoped<IStationService, StationService>();

// ----------------------------
// 4️⃣ Add Controllers
// ----------------------------
builder.Services.AddControllers();

// ----------------------------
// 5️⃣ Configure Swagger/OpenAPI
// ----------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Station API",
        Version = "v1",
        Description = "API for managing EV charging stations in EV Station-based Rental System"
    });
});

// ----------------------------
// 6️⃣ Add CORS (if needed)
// ----------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ----------------------------
// 7️⃣ Configure HTTP request pipeline
// ----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
