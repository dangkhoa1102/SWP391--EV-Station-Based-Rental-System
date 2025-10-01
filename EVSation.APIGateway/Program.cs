using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load JwtOptions from config
var jwtSection = builder.Configuration.GetSection("JwtOptions");
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];
var secret = jwtSection["Secret"];

// Add Authentication
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

builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseRouting();

// Use Authentication before Ocelot
app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();

app.Run();
