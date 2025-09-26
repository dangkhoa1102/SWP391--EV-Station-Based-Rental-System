using APIs.Entities;
using APIs.Services;
using ev_rental_system.DTOs.Request;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JWTTokenGenerator _jwtTokenGenerator;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, JWTTokenGenerator jwtTokkenGenerator, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenGenerator = jwtTokkenGenerator;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var user = new ApplicationUser
            {   
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _signInManager.SignInAsync(user, isPersistent: false);
            return Ok(new { message = "Đăng ký thành công", user.FullName });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null) return Unauthorized("Invalid username");

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded) return Unauthorized("Invalid password");

            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _jwtTokenGenerator.CreateToken(user, roles);
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            user.RefreshTokens ??= new List<RefreshToken>();
            user.RefreshTokens.Add(refreshToken);
            await _userManager.UpdateAsync(user);            

            return Ok(new
            {
                accessToken,
                refreshToken = refreshToken.Token,                
                email = user.Email,           
                roles
            });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] string token)
        {
            var user = await _userManager.Users
                .Include(u => u.RefreshTokens)
                .SingleOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));

            if (user is null) return Unauthorized();
            
            var storedToken = user.RefreshTokens.Single(t => t.Token == token);
            if (!storedToken.IsActive) return Unauthorized("Invalid refresh token");

            var roles = await _userManager.GetRolesAsync(user);

            // Tạo token mới
            var accessToken = _jwtTokenGenerator.CreateToken(user, roles);
            var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            // revoke old refresh token
            storedToken.Revoked = DateTime.UtcNow;
            user.RefreshTokens.Add(newRefreshToken);
            await _userManager.UpdateAsync(user);            

            return Ok(new
            {
                accessToken,
                refreshToken = newRefreshToken.Token
            });
        }

        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleResponse")
            };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("GoogleResponse")]
        public IActionResult GoogleResponse()
        {
            if (!User.Identity.IsAuthenticated)
                return BadRequest("Google login failed");

            var claims = User.Claims.ToList();
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            return Ok(new { name, email });
        }

        [HttpGet("google-login-url")]
        public IActionResult GoogleLoginUrl()
        {
            var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
            var redirectUri = Url.Action("GoogleResponse", "Auth", null, Request.Scheme);
            var scope = "openid%20email%20profile";
            var url = $"https://accounts.google.com/o/oauth2/v2/auth?client_id={clientId}&redirect_uri={Uri.EscapeDataString(redirectUri)}&response_type=code&scope={scope}&access_type=offline&prompt=consent";
            return Ok(new { url });
        }


    }
}
