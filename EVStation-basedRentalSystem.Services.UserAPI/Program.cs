using EVStation_basedRentalSystem.Services.UserAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using EVStation_basedRentalSystem.Services.UserAPI.Clients;

var builder = WebApplication.CreateBuilder(args);

// 1️⃣ Database connection
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2️⃣ AutoMapper (if needed)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// 3️⃣ AuthServiceClient
builder.Services.AddHttpClient<AuthServiceClient>();

// 4️⃣ JWT Authentication
var jwtOptions = builder.Configuration.GetSection("JwtOptions");
var secret = jwtOptions.GetValue<string>("Secret");
var issuer = jwtOptions.GetValue<string>("Issuer");
var audience = jwtOptions.GetValue<string>("Audience");
builder.Services.AddHttpClient<AuthServiceClient>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})

.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
    };
});

// 5️⃣ Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 6️⃣ Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
