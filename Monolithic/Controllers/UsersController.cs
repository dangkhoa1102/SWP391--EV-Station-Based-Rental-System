using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;
using System.Security.Claims;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public UsersController(IAuthService authService, IUserService userService)
        {
            _authService = authService;
            _userService = userService;
        }

        #region Current User APIs

        /// <summary>
        /// Xem thông tin cá nhân của user hiện tại
        /// </summary>
        [HttpGet("Get-My-Profile")]
        public async Task<ActionResult<ResponseDto<UserDto>>> GetMyProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<UserDto>.Failure("Unauthorized"));
            }

            var result = await _authService.GetCurrentUserAsync(userId);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật thông tin cá nhân
        /// </summary>
        [HttpPut("Update-My-Profile")]
        public async Task<ActionResult<ResponseDto<UserDto>>> UpdateMyProfile([FromBody] UpdateUserDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<UserDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<UserDto>.Failure("Unauthorized"));
            }

            var result = await _authService.UpdateUserAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đổi mật khẩu
        /// </summary>
        [HttpPost("Change-Password")]
        public async Task<ActionResult<ResponseDto<string>>> ChangePassword([FromBody] ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<string>.Failure("Dữ liệu không hợp lệ"));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<string>.Failure("Unauthorized"));
            }

            var result = await _authService.ChangePasswordAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        #endregion

        #region Admin User Management APIs

        /// <summary>
        /// Lấy danh sách tất cả người dùng (có phân trang, tìm kiếm, lọc) - Admin only
        /// </summary>
        [HttpGet("Get-All")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<PaginationDto<UserDto>>>> GetAllUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] bool? isActive = null)
        {
            try
            {
                var (users, total) = await _userService.GetUsersAsync(page, pageSize, search, role, isActive);

                var userDtos = users.Select(u => new UserDto
                {
                    Id = u.UserId.ToString(),
                    Email = u.Email ?? "",
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber ?? "",
                    UserRole = u.UserRole,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                }).ToList();

                var paginationDto = new PaginationDto<UserDto>(userDtos, page, pageSize, total);

                return Ok(ResponseDto<PaginationDto<UserDto>>.Success(paginationDto));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<PaginationDto<UserDto>>.Failure($"Lỗi khi lấy danh sách người dùng: {ex.Message}"));
            }
        }

        /// <summary>
        /// Xem thông tin chi tiết một user theo ID - Admin/StationStaff
        /// </summary>
        [HttpGet("Get-By-{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<UserDto>>> GetUserById(string id)
        {
            try
            {
                var user = await _userService.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(ResponseDto<UserDto>.Failure("Không tìm thấy người dùng"));
                }

                var userDto = new UserDto
                {
                    Id = user.UserId.ToString(),
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber ?? "",
                    UserRole = user.UserRole,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(ResponseDto<UserDto>.Success(userDto));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<UserDto>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Tìm kiếm người dùng theo tên, email (trả về tối đa 20 kết quả) - Admin/StationStaff
        /// </summary>
        [HttpGet("Search")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.StationStaff}")]
        public async Task<ActionResult<ResponseDto<List<UserDto>>>> SearchUsers([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm) || searchTerm.Length < 2)
                {
                    return BadRequest(ResponseDto<List<UserDto>>.Failure("Từ khóa tìm kiếm phải có ít nhất 2 ký tự"));
                }

                var users = await _userService.SearchUsersByNameAsync(searchTerm);

                var userDtos = users.Select(u => new UserDto
                {
                    Id = u.UserId.ToString(),
                    Email = u.Email ?? "",
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber ?? "",
                    UserRole = u.UserRole,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                }).ToList();

                return Ok(ResponseDto<List<UserDto>>.Success(userDtos));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<List<UserDto>>.Failure($"Lỗi tìm kiếm: {ex.Message}"));
            }
        }

        /// <summary>
        /// Vô hiệu hóa tài khoản người dùng (soft delete) - Admin only
        /// </summary>
        [HttpPatch("Deactivate-By-{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> DeactivateUser(string id)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == id)
                {
                    return BadRequest(ResponseDto<string>.Failure("Không thể vô hiệu hóa tài khoản của chính bạn"));
                }

                var result = await _userService.DeactivateUserAsync(id);
                if (!result)
                {
                    return NotFound(ResponseDto<string>.Failure("Không tìm thấy người dùng hoặc không thể vô hiệu hóa"));
                }

                return Ok(ResponseDto<string>.Success("Vô hiệu hóa tài khoản thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Kích hoạt lại tài khoản người dùng - Admin only
        /// </summary>
        [HttpPatch("Activate-By-{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> ActivateUser(string id)
        {
            try
            {
                var result = await _userService.ActivateUserAsync(id);
                if (!result)
                {
                    return NotFound(ResponseDto<string>.Failure("Không tìm thấy người dùng hoặc không thể kích hoạt"));
                }

                return Ok(ResponseDto<string>.Success("Kích hoạt tài khoản thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Cập nhật vai trò của người dùng - Admin only
        /// </summary>
        [HttpPatch("Update-Role-By-{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<string>>> UpdateUserRole(string id, [FromQuery] string newRole)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (currentUserId == id)
                {
                    return BadRequest(ResponseDto<string>.Failure("Không thể thay đổi vai trò của chính bạn"));
                }

                // Validate role
                var validRoles = new[] { AppRoles.Admin, AppRoles.StationStaff, AppRoles.EVRenter };
                if (!validRoles.Contains(newRole))
                {
                    return BadRequest(ResponseDto<string>.Failure($"Vai trò không hợp lệ. Các vai trò hợp lệ: {string.Join(", ", validRoles)}"));
                }

                var result = await _userService.UpdateUserRoleAsync(id, newRole);
                if (!result)
                {
                    return NotFound(ResponseDto<string>.Failure("Không tìm thấy người dùng hoặc không thể cập nhật vai trò"));
                }

                return Ok(ResponseDto<string>.Success($"Cập nhật vai trò thành '{newRole}' thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy tổng số người dùng - Admin only
        /// </summary>
        [HttpGet("Get-Total-Count")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<int>>> GetTotalUsersCount()
        {
            try
            {
                var count = await _userService.GetTotalUsersCountAsync();
                return Ok(ResponseDto<int>.Success(count));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<int>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy thống kê người dùng theo vai trò - Admin only
        /// </summary>
        [HttpGet("Get-Statistics-By-Role")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<ResponseDto<Dictionary<string, int>>>> GetUserStatisticsByRole()
        {
            try
            {
                var statistics = await _userService.GetUserStatisticsByRoleAsync();
                return Ok(ResponseDto<Dictionary<string, int>>.Success(statistics));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<Dictionary<string, int>>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion
    }
}
