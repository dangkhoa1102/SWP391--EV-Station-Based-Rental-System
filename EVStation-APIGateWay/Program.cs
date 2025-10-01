using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load Ocelot configuration
builder.Configuration.AddJsonFile("ocelot.json");

// Load JWT options from appsettings
var jwtOptions = builder.Configuration.GetSection("JwtOptions");
var secret = jwtOptions["Secret"];
var issuer = jwtOptions["Issuer"];
var audience = jwtOptions["Audience"];

// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Add Ocelot services
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// Routing
app.UseRouting();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/", () => "Ocelot Gateway is running");

// Run Ocelot
await app.UseOcelot();

app.Run();
