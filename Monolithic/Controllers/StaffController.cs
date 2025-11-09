using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Common;
using Monolithic.DTOs.Admin;
using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using System.Security.Claims;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{AppRoles.StationStaff},{AppRoles.Admin}")]
    public class StaffController : ControllerBase
    {
        private readonly EVStationBasedRentalSystemDbContext _context;

        public StaffController(EVStationBasedRentalSystemDbContext context)
        {
   _context = context;
     }

  #region Document Verification for Staff

        /// <summary>
        /// Staff: L?y thông tin gi?y t? c?a user (CCCD và GPLX)
        /// </summary>
        [HttpGet("Users/{userId}/Documents")]
        public async Task<ActionResult<ResponseDto<UserDocumentDetailsDto>>> GetUserDocuments(Guid userId)
    {
  try
       {
      var user = await _context.Users.FindAsync(userId);
if (user == null)
                {
  return NotFound(ResponseDto<UserDocumentDetailsDto>.Failure("Không tìm th?y ng??i dùng"));
                }

          // Ch? cho phép xem gi?y t? c?a EVRenter
if (user.UserRole != AppRoles.EVRenter)
              {
         return BadRequest(ResponseDto<UserDocumentDetailsDto>.Failure(
        "Ch? có th? xem gi?y t? c?a EVRenter"));
      }

   var documentDetails = new UserDocumentDetailsDto
   {
               UserId = user.UserId,
       FullName = $"{user.FirstName} {user.LastName}",
     Email = user.Email ?? "",
            PhoneNumber = user.PhoneNumber,
   UserRole = user.UserRole,
          CccdImageUrl_Front = user.CccdImageUrl_Front,
            CccdImageUrl_Back = user.CccdImageUrl_Back,
     GplxImageUrl_Front = user.GplxImageUrl_Front,
     GplxImageUrl_Back = user.GplxImageUrl_Back,
        DriverLicenseNumber = user.DriverLicenseNumber,
             DriverLicenseExpiry = user.DriverLicenseExpiry,
          IsVerified = user.IsVerified,
           CreatedAt = user.CreatedAt,
      UpdatedAt = user.UpdatedAt
   };

      return Ok(ResponseDto<UserDocumentDetailsDto>.Success(documentDetails, 
   "L?y thông tin gi?y t? thành công"));
            }
    catch (Exception ex)
            {
  return BadRequest(ResponseDto<UserDocumentDetailsDto>.Failure($"L?i: {ex.Message}"));
         }
        }

        /// <summary>
        /// Staff: L?y danh sách user có gi?y t? c?n xác minh
        /// </summary>
        [HttpGet("Users/Pending-Verification")]
        public async Task<ActionResult<ResponseDto<List<UserDocumentDetailsDto>>>> GetUsersWithPendingDocuments()
  {
            try
     {
    var usersWithDocuments = await _context.Users
    .Where(u => u.IsActive && u.UserRole == AppRoles.EVRenter && !u.IsVerified &&
           (!string.IsNullOrEmpty(u.CccdImageUrl_Front) || !string.IsNullOrEmpty(u.GplxImageUrl_Front)))
        .OrderBy(u => u.CreatedAt)
 .ToListAsync();

                var documentsList = usersWithDocuments.Select(user => new UserDocumentDetailsDto
                {
     UserId = user.UserId,
        FullName = $"{user.FirstName} {user.LastName}",
Email = user.Email ?? "",
          PhoneNumber = user.PhoneNumber,
     UserRole = user.UserRole,
         CccdImageUrl_Front = user.CccdImageUrl_Front,
  CccdImageUrl_Back = user.CccdImageUrl_Back,
            GplxImageUrl_Front = user.GplxImageUrl_Front,
           GplxImageUrl_Back = user.GplxImageUrl_Back,
        DriverLicenseNumber = user.DriverLicenseNumber,
       DriverLicenseExpiry = user.DriverLicenseExpiry,
          IsVerified = user.IsVerified,
        CreatedAt = user.CreatedAt,
         UpdatedAt = user.UpdatedAt
     }).ToList();

           return Ok(ResponseDto<List<UserDocumentDetailsDto>>.Success(documentsList, 
        $"Tìm th?y {documentsList.Count} user có gi?y t? c?n xác minh"));
            }
   catch (Exception ex)
          {
  return BadRequest(ResponseDto<List<UserDocumentDetailsDto>>.Failure($"L?i: {ex.Message}"));
      }
 }

        /// <summary>
        /// Staff: Xác minh gi?y t? c?a user
      /// </summary>
        [HttpPost("Users/Verify-Documents")]
        public async Task<ActionResult<ResponseDto<string>>> VerifyUserDocuments([FromBody] VerifyUserDocumentsDto request)
        {
          try
        {
     var user = await _context.Users.FindAsync(request.UserId);
    if (user == null)
   {
        return NotFound(ResponseDto<string>.Failure("Không tìm th?y ng??i dùng"));
            }

                // Ch? cho phép xác minh gi?y t? c?a EVRenter
         if (user.UserRole != AppRoles.EVRenter)
     {
      return BadRequest(ResponseDto<string>.Failure("Ch? có th? xác minh gi?y t? c?a EVRenter"));
             }

          // L?y thông tin staff ?ang th?c hi?n xác minh
     var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
       var staffRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

// Update verification status
          user.IsVerified = request.IsVerified;
 user.UpdatedAt = DateTime.UtcNow;

   await _context.SaveChangesAsync();

     var statusText = request.IsVerified ? "xác minh" : "t? ch?i xác minh";
         var staffType = staffRoleClaim == AppRoles.Admin ? "Admin" : "Staff";
    var message = $"{staffType} ?ã {statusText} gi?y t? c?a {user.FirstName} {user.LastName}";
        
            if (!string.IsNullOrEmpty(request.VerificationNotes))
      {
        message += $". Ghi chú: {request.VerificationNotes}";
}

        return Ok(ResponseDto<string>.Success("", message));
    }
            catch (Exception ex)
  {
                return BadRequest(ResponseDto<string>.Failure($"L?i: {ex.Message}"));
            }
        }

   /// <summary>
        /// Staff: L?y th?ng kê v? tình tr?ng xác minh gi?y t?
        /// </summary>
        [HttpGet("Users/Document-Statistics")]
     public async Task<ActionResult<ResponseDto<object>>> GetDocumentVerificationStatistics()
        {
        try
  {
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive && u.UserRole == AppRoles.EVRenter);
    var verifiedUsers = await _context.Users.CountAsync(u => u.IsActive && u.UserRole == AppRoles.EVRenter && u.IsVerified);
  var usersWithCccd = await _context.Users.CountAsync(u => u.IsActive && u.UserRole == AppRoles.EVRenter && !string.IsNullOrEmpty(u.CccdImageUrl_Front));
             var usersWithGplx = await _context.Users.CountAsync(u => u.IsActive && u.UserRole == AppRoles.EVRenter && !string.IsNullOrEmpty(u.GplxImageUrl_Front));
                var pendingVerification = await _context.Users.CountAsync(u => u.IsActive && u.UserRole == AppRoles.EVRenter && !u.IsVerified && 
     (!string.IsNullOrEmpty(u.CccdImageUrl_Front) || !string.IsNullOrEmpty(u.GplxImageUrl_Front)));

  var statistics = new
   {
       TotalEVRenters = totalUsers,
          VerifiedUsers = verifiedUsers,
      UsersWithCCCD = usersWithCccd,
       UsersWithGPLX = usersWithGplx,
         PendingVerification = pendingVerification,
           VerificationRate = totalUsers > 0 ? Math.Round((double)verifiedUsers / totalUsers * 100, 2) : 0,
      DocumentCompletionRate = new
        {
   CCCD = totalUsers > 0 ? Math.Round((double)usersWithCccd / totalUsers * 100, 2) : 0,
       GPLX = totalUsers > 0 ? Math.Round((double)usersWithGplx / totalUsers * 100, 2) : 0
        }
};

    return Ok(ResponseDto<object>.Success(statistics, "Th?ng kê xác minh gi?y t?"));
            }
    catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"L?i: {ex.Message}"));
     }
        }

        #endregion

        #region Staff Profile & Station Info

        /// <summary>
    /// Staff: Xem thông tin cá nhân và station ???c gán
        /// </summary>
        [HttpGet("My-Profile")]
        public async Task<ActionResult<ResponseDto<object>>> GetMyProfile()
     {
        try
            {
          var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
         if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffId))
{
          return Unauthorized(ResponseDto<object>.Failure("Unauthorized"));
      }

 var staff = await _context.Users
           .Include(u => u.Station)
         .FirstOrDefaultAsync(u => u.UserId == staffId);

if (staff == null)
      {
         return NotFound(ResponseDto<object>.Failure("Không tìm th?y thông tin staff"));
 }

       var profile = new
      {
      UserId = staff.UserId,
           FullName = $"{staff.FirstName} {staff.LastName}",
             Email = staff.Email,
         PhoneNumber = staff.PhoneNumber,
              UserRole = staff.UserRole,
              IsActive = staff.IsActive,
 CreatedAt = staff.CreatedAt,
             AssignedStation = staff.Station != null ? new
     {
            StationId = staff.Station.StationId,
       StationName = staff.Station.Name,
   StationAddress = staff.Station.Address,
   TotalSlots = staff.Station.TotalSlots,
  AvailableSlots = staff.Station.AvailableSlots
      } : null,
    IsAssignedToStation = staff.StationId.HasValue
                };

  return Ok(ResponseDto<object>.Success(profile, "L?y thông tin profile thành công"));
        }
            catch (Exception ex)
  {
        return BadRequest(ResponseDto<object>.Failure($"L?i: {ex.Message}"));
       }
        }

        #endregion
    }
}