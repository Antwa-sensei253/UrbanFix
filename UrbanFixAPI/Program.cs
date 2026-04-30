using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UrbanFixAPI.Data;
using UrbanFixAPI.Helpers;
using UrbanFixAPI.Workers;
using DotNetEnv;

Env.Load();
var builder = WebApplication.CreateBuilder(args);

// 0. Disable default JWT claim mapping (to keep names like "role" and "user_id")
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// 1. Controllers
builder.Services.AddControllers();

// 2. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// 3. DbContext — SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")!));

// 4. JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSection["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });

// 5. Authorization
builder.Services.AddAuthorization();

// 6. Scoped services
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<EmailService>();

// 7. Background workers
builder.Services.AddHostedService<ArchiveWorker>();
builder.Services.AddHostedService<SlaEscalationWorker>();
// builder.Services.AddHostedService<DailyExecutiveSummaryWorker>(); // Disabled to stop sending daily emails

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(context);
}

// Middleware pipeline — exact order
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
