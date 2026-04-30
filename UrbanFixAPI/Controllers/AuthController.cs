using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;
using UrbanFixAPI.Helpers;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly EmailService _emailService;

    public AuthController(AppDbContext context, JwtHelper jwtHelper, EmailService emailService)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.NationalId) ||
            string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Email) ||
            string.IsNullOrEmpty(request.Role))
        {
            return BadRequest(new { message = "Invalid registration data." });
        }

        var validRoles = new[] { "Citizen", "DistrictManager", "Technician" };
        if (!validRoles.Contains(request.Role))
        {
            return BadRequest(new { message = "Invalid registration data." });
        }

        if (await _context.Users.AnyAsync(u => u.NationalId == request.NationalId))
        {
            return Conflict(new { message = "A user with this National ID already exists." });
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return Conflict(new { message = "A user with this Email already exists." });
        }

        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        var user = new User
        {
            FullName = request.FullName,
            NationalId = request.NationalId,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Email = request.Email,
            Role = request.Role,
            DistrictId = request.DistrictId,
            OtpCode = otpCode,
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
            IsVerified = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendOtpAsync(request.Email, request.FullName, otpCode);
        }
        catch (Exception ex)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return StatusCode(500, new { message = ex.Message });
        }

        return Ok(new { message = "OTP sent to your email address." });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NationalId == request.NationalId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (user.OtpCode != request.Otp || user.OtpExpiry == null || DateTime.UtcNow > user.OtpExpiry)
        {
            return BadRequest(new { message = "Invalid or expired OTP." });
        }

        user.IsVerified = true;
        user.OtpCode = null;
        user.OtpExpiry = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Verification successful. You can now log in." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NationalId == request.NationalId);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        if (!user.IsVerified)
        {
            return StatusCode(403, new { message = "Account not verified. Please complete OTP verification." });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var token = _jwtHelper.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Role, user.Id, user.FullName));
    }

    [HttpGet("districts")]
    public async Task<IActionResult> GetDistricts()
    {
        var districts = await _context.Districts
            .Select(d => new { d.Id, d.Name })
            .ToListAsync();
        return Ok(districts);
    }
}
