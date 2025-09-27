
using APIs.Configurations;
using APIs.Data;
using APIs.Entities;
using APIs.Extensions;
using APIs.Repositories;
using APIs.Services;
using DotNetEnv;
using ev_rental_system.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;

namespace APIs
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            Env.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

            var connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
            builder.Services.AddDbContext<DataContext>(options =>
                options.UseSqlServer(connString));

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("oauth2", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey
                });

                options.OperationFilter<SecurityRequirementsOperationFilter>();

                options.SwaggerDoc("v1", new OpenApiInfo { Title = "EV Station-based Rental System", Version = "v1" });
            });
            //builder.Services.AddDbContext<DataContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddAuthorization();

            //builder.Services.AddIdentityApiEndpoints<ApplicationUser>().AddEntityFrameworkStores<DataContext>();

            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = true;
            })
                .AddEntityFrameworkStores<DataContext>()
                .AddDefaultTokenProviders();

            builder.Services.AddScoped<JWTTokenGenerator>();

            builder.Services.AddJwtAuthentication(builder.Configuration);

            builder.Services.AddAppAuthentication();

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
            });

            builder.Services.AddScoped<DataSeeder>(); // Register DataSeeder to the DI container

            builder.Services.AddTransient<IEmailService, SmtpEmailService>();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {                
                var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
                await seeder.SeedAsync(); // Seed roles and admin user
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            //var identityGroup = app.MapGroup("/api");

            //identityGroup.MapIdentityApi<ApplicationUser>();

            app.UseHttpsRedirection();

            app.UseCors("AllowAll");

            app.UseAuthentication();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
