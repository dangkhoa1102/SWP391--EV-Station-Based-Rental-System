using EVStation_basedRendtalSystem.Services.FeedbackAPI.Data;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Repository.IRepository;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Services;
using EVStation_basedRendtalSystem.Services.FeedbackAPI.Services.IService;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------
// 1️⃣ Configure DbContext
// ----------------------------
builder.Services.AddDbContext<FeedbackDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ----------------------------
// 2️⃣ Register Repository
// ----------------------------
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();

// ----------------------------
// 3️⃣ Register Service
// ----------------------------
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

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
        Title = "Feedback API",
        Version = "v1",
        Description = "API for managing feedbacks in EV Station-based Rental System"
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
