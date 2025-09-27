using APIs.Entities;
using APIs.Services;
using APIs.Services;
using ev_rental_system.DTOs.Request;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
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
        private readonly IWebHostEnvironment _environment;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, JWTTokenGenerator jwtTokkenGenerator, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenGenerator = jwtTokkenGenerator;
            _configuration = configuration;
            _environment = environment;
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

        [HttpGet("confirm-renter")]
        [AllowAnonymous] // link email có thể được click không cần login
        public async Task<IActionResult> ConfirmRenter(string userId, string token)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
                return BadRequest("UserId and Token are required");

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return NotFound();

            // decode token
            var decodedToken = System.Net.WebUtility.UrlDecode(token);

            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
            if (!result.Succeeded) return BadRequest("Invalid token");

            // Chỉ gán role nếu chưa có role nào
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Any())
            {
                var addRoleResult = await _userManager.AddToRoleAsync(user, "RENTER");
                if (!addRoleResult.Succeeded) return StatusCode(500, "Failed to assign RENTER role");
            }

            // redirect tới 1 trang frontend báo success
            // return Redirect("https://yourfrontend.com/confirm-success");
            return Ok("Your email has been confirmed. You are now a RENTER.");
        }

        [HttpPost("upload-cccd/gplx"), Authorize]
        public async Task<IActionResult> UploadImages(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("Không có file nào được upload");

            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var urls = new List<string>();

            foreach (var file in files)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                urls.Add($"{Request.Scheme}://{Request.Host}/uploads/{fileName}");
            }

            return Ok(new { urls });
        }
    }
}
