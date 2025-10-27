using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Data;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;
using System.Security.Claims;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPhotoService _photoService;
        private readonly EVStationBasedRentalSystemDbContext _context;

        public AuthController(IAuthService authService, IPhotoService photoService, EVStationBasedRentalSystemDbContext context)
        {
            _authService = authService;
            _photoService = photoService;
            _context = context;
        }

        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        [HttpPost("Register")]
        [ProducesResponseType(typeof(ResponseDto<UserDto>), 200)]
        public async Task<ActionResult<ResponseDto<UserDto>>> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<UserDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _authService.RegisterAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đăng nhập hệ thống
        /// </summary>
        [HttpPost("Login")]
        public async Task<ActionResult<ResponseDto<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<LoginResponseDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _authService.LoginAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đăng xuất khỏi hệ thống
        /// </summary>
        [HttpPost("Logout")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<string>>> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<string>.Failure("Unauthorized"));
            }

            var result = await _authService.LogoutAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Làm mới Access Token
        /// </summary>
        [HttpPost("Refresh-Token")]
        public async Task<ActionResult<ResponseDto<string>>> RefreshToken([FromBody] string refreshToken)
        {
            var result = await _authService.RefreshTokenAsync(refreshToken);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // Hàm helper để lấy ID của Renter đang đăng nhập từ JWT Token
    private string GetCurrentRenterId()
    {
        // Tùy thuộc vào cách bạn cấu hình JWT, claim chứa ID có thể là:
        // ClaimTypes.NameIdentifier (thường là "nameid")
        // hoặc "sub"
        var renterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Nếu bạn dùng một claim tên khác (ví dụ "uid"), hãy đổi ở đây
        // var renterId = User.FindFirst("uid")?.Value;

        return renterId;
    }

        // Hàm helper để lấy ID (đã sửa để dùng Guid.TryParse)
        private bool TryGetCurrentRenterId(out Guid renterId)
        {
            renterId = Guid.Empty;
            // Tùy vào cách bạn tạo token, claim có thể là:
            // JwtRegisteredClaimNames.Sub ("sub")
            // ClaimTypes.NameIdentifier ("nameid")
            // "uid" (tên tùy chỉnh)
            var renterIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(renterIdString))
            {
                return false;
            }

            return Guid.TryParse(renterIdString, out renterId);
        }

        [HttpPost("cccd")]
    public async Task<IActionResult> UploadCccd(IFormFile fileFront, IFormFile fileBack)
    {
            // 1. Kiểm tra file
            if (fileFront == null || fileFront.Length == 0)
            {
                return BadRequest("Vui lòng cung cấp ảnh mặt trước (fileFront).");
            }
            if (fileBack == null || fileBack.Length == 0)
            {
                return BadRequest("Vui lòng cung cấp ảnh mặt sau (fileBack).");
            }

            // 2. Xác thực User
            if (!TryGetCurrentRenterId(out Guid renterId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            var user = await _context.Users.FindAsync(renterId);
            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản User.");
            }

            // 3. Xử lý ảnh mặt trước
            if (!string.IsNullOrEmpty(user.CccdImagePublicId_Front))
            {
                await _photoService.DeletePhotoAsync(user.CccdImagePublicId_Front);
            }

            var frontUploadResult = await _photoService.AddPhotoAsync(fileFront, "rental_app/cccd");
            if (frontUploadResult.Error != null)
            {
                return BadRequest($"Lỗi upload mặt trước: {frontUploadResult.Error.Message}");
            }

            // 4. Xử lý ảnh mặt sau
            if (!string.IsNullOrEmpty(user.CccdImagePublicId_Back))
            {
                await _photoService.DeletePhotoAsync(user.CccdImagePublicId_Back);
            }

            var backUploadResult = await _photoService.AddPhotoAsync(fileBack, "rental_app/cccd");
            if (backUploadResult.Error != null)
            {
                // Cân nhắc: Xóa ảnh mặt trước vừa upload nếu mặt sau lỗi? (Để đảm bảo tính toàn vẹn)
                await _photoService.DeletePhotoAsync(frontUploadResult.PublicId);
                return BadRequest($"Lỗi upload mặt sau: {backUploadResult.Error.Message}");
            }

            // 5. Cập nhật vào DB
            user.CccdImageUrl_Front = frontUploadResult.SecureUrl.ToString();
            user.CccdImagePublicId_Front = frontUploadResult.PublicId;
            user.CccdImageUrl_Back = backUploadResult.SecureUrl.ToString();
            user.CccdImagePublicId_Back = backUploadResult.PublicId;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 6. Trả về cả 2 URL
            return Ok(new
            {
                frontUrl = user.CccdImageUrl_Front,
                backUrl = user.CccdImageUrl_Back
            });

            //var renterIdString = GetCurrentRenterId();
            //if (string.IsNullOrEmpty(renterIdString))
            //{
            //    return Unauthorized("Không thể xác định người dùng.");
            //}

            //// Chuyển string sang Guid
            //if (!Guid.TryParse(renterIdString, out Guid renterId))
            //{
            //    return BadRequest("ID người dùng không hợp lệ.");
            //}

            //// Tìm Renter trong DB
            //var renter = await _context.Users.FindAsync(renterId); // Hoặc Users.FindAsync()
            //if (renter is null)
            //{
            //    return NotFound("Không tìm thấy tài khoản Renter.");
            //}

            //// Nếu Renter đã upload ảnh trước đó -> Xóa ảnh cũ
            //if (!string.IsNullOrEmpty(renter.CccdImagePublicId))
            //{
            //    await _photoService.DeletePhotoAsync(renter.CccdImagePublicId);
            //}

            //// Upload ảnh mới lên Cloudinary vào thư mục "rental_app/cccd"
            //var uploadResult = await _photoService.AddPhotoAsync(file, "rental_app/cccd");
            //if (uploadResult.Error != null)
            //{
            //    return BadRequest($"Lỗi Cloudinary: {uploadResult.Error.Message}");
            //}

            //// Cập nhật đường dẫn vào DB
            //renter.CccdImageUrl = uploadResult.SecureUrl.ToString();
            //renter.CccdImagePublicId = uploadResult.PublicId;
            //    renter.UpdatedAt = DateTime.UtcNow;

            //await _context.SaveChangesAsync();

            //// Trả về URL để client có thể hiển thị nếu muốn
            //return Ok(new { url = renter.CccdImageUrl });
        }

    [HttpPost("gplx")]
    public async Task<IActionResult> UploadGplx(IFormFile fileFront, IFormFile fileBack)
    {
            if (fileFront == null || fileFront.Length == 0 || fileBack == null || fileBack.Length == 0)
            {
                return BadRequest("Vui lòng cung cấp cả ảnh mặt trước (fileFront) và mặt sau (fileBack).");
            }

            if (!TryGetCurrentRenterId(out Guid renterId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            var user = await _context.Users.FindAsync(renterId);
            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản User.");
            }

            // Xử lý mặt trước
            if (!string.IsNullOrEmpty(user.GplxImagePublicId_Front))
            {
                await _photoService.DeletePhotoAsync(user.GplxImagePublicId_Front);
            }
            var frontResult = await _photoService.AddPhotoAsync(fileFront, "rental_app/gplx");
            if (frontResult.Error != null) return BadRequest($"Lỗi mặt trước: {frontResult.Error.Message}");

            // Xử lý mặt sau
            if (!string.IsNullOrEmpty(user.GplxImagePublicId_Back))
            {
                await _photoService.DeletePhotoAsync(user.GplxImagePublicId_Back);
            }
            var backResult = await _photoService.AddPhotoAsync(fileBack, "rental_app/gplx");
            if (backResult.Error != null)
            {
                await _photoService.DeletePhotoAsync(frontResult.PublicId); // Rollback
                return BadRequest($"Lỗi mặt sau: {backResult.Error.Message}");
            }

            // Lưu DB
            user.GplxImageUrl_Front = frontResult.SecureUrl.ToString();
            user.GplxImagePublicId_Front = frontResult.PublicId;
            user.GplxImageUrl_Back = backResult.SecureUrl.ToString();
            user.GplxImagePublicId_Back = backResult.PublicId;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                frontUrl = user.GplxImageUrl_Front,
                backUrl = user.GplxImageUrl_Back
            });
            //    var renterId = GetCurrentRenterId();
            //    if (string.IsNullOrEmpty(renterId))
            //    {
            //        return Unauthorized("Không thể xác định người dùng.");
            //    }

            //    var renter = await _context.Users.FindAsync();
            //    if (renter == null)
            //    {
            //        return NotFound("Không tìm thấy tài khoản Renter.");
            //    }

            //    // Xóa ảnh GPLX cũ nếu có
            //    if (!string.IsNullOrEmpty(renter.GplxImagePublicId))
            //    {
            //        await _photoService.DeletePhotoAsync(renter.GplxImagePublicId);
            //    }

            //    // Upload ảnh mới lên Cloudinary vào thư mục "rental_app/gplx"
            //    var uploadResult = await _photoService.AddPhotoAsync(file, "rental_app/gplx");
            //    if (uploadResult.Error != null)
            //    {
            //        return BadRequest($"Lỗi Cloudinary: {uploadResult.Error.Message}");
            //    }

            //    // Cập nhật DB
            //    renter.GplxImageUrl = uploadResult.SecureUrl.ToString();
            //    renter.GplxImagePublicId = uploadResult.PublicId;

            //    await _context.SaveChangesAsync();

            //    return Ok(new { url = renter.GplxImageUrl });
        }

        [HttpGet("me")]
        [Authorize] // Chỉ Renter mới được gọi, tuy nhiên role renter đang trục trặc nên tui để tạm authorize chung
        public async Task<IActionResult> GetMyDocuments()
        {
            if (!TryGetCurrentRenterId(out Guid renterId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            var user = await _context.Users.FindAsync(renterId);
            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản User.");
            }

            // Tạo DTO để trả về
            var documentUrls = new UserDocumentsDto
            {
                CccdImageUrl_Front = user.CccdImageUrl_Front,
                CccdImageUrl_Back = user.CccdImageUrl_Back,
                GplxImageUrl_Front = user.GplxImageUrl_Front,
                GplxImageUrl_Back = user.GplxImageUrl_Back,
                IsVerified = user.IsVerified
            };

            return Ok(documentUrls);
        }

        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin, StationStaff")] // Chỉ Admin hoặc Staff
        public async Task<IActionResult> GetDocumentsForUser(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản User.");
            }

            // Chỉ cho phép xem giấy tờ của Renter
            if (user.UserRole != "Renter") // (Đây là lý do bạn nên dùng Identity Roles)
            {
                return BadRequest("Đây không phải là tài khoản Renter.");
            }

            var documentUrls = new UserDocumentsDto
            {
                CccdImageUrl_Front = user.CccdImageUrl_Front,
                CccdImageUrl_Back = user.CccdImageUrl_Back,
                GplxImageUrl_Front = user.GplxImageUrl_Front,
                GplxImageUrl_Back = user.GplxImageUrl_Back,
                IsVerified = user.IsVerified
            };

            return Ok(documentUrls);
        }
    }
}
