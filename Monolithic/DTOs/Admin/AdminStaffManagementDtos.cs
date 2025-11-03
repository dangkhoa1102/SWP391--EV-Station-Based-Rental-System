using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Admin
{
    public class AssignStaffToStationDto
    {
        [Required]
        public Guid StaffId { get; set; }

 [Required]
      public Guid StationId { get; set; }

        public string? Reason { get; set; }
    }

    public class StaffAssignmentResponseDto
    {
        public Guid StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string StaffEmail { get; set; } = string.Empty;
        public Guid? PreviousStationId { get; set; }
        public string? PreviousStationName { get; set; }
  public Guid NewStationId { get; set; }
        public string NewStationName { get; set; } = string.Empty;
        public string AssignedBy { get; set; } = string.Empty;
   public DateTime AssignedAt { get; set; }
        public string? Reason { get; set; }
    }

    public class UnassignStaffDto
    {
    [Required]
   public Guid StaffId { get; set; }

        public string? Reason { get; set; }
    }

 public class UserDocumentDetailsDto
    {
        public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
 public string Email { get; set; } = string.Empty;
public string? PhoneNumber { get; set; }
     public string UserRole { get; set; } = string.Empty;
        
 // CCCD Information
        public string? CccdImageUrl_Front { get; set; }
        public string? CccdImageUrl_Back { get; set; }
        
        // Driver License Information
        public string? GplxImageUrl_Front { get; set; }
        public string? GplxImageUrl_Back { get; set; }
        public string? DriverLicenseNumber { get; set; }
        public DateOnly? DriverLicenseExpiry { get; set; }
  
        // Verification status
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
  public DateTime? UpdatedAt { get; set; }
 }

    public class VerifyUserDocumentsDto
    {
        [Required]
        public Guid UserId { get; set; }

    [Required]
  public bool IsVerified { get; set; }

        public string? VerificationNotes { get; set; }
    }

    public class StaffListDto
    {
        public Guid UserId { get; set; }
 public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public Guid? StationId { get; set; }
        public string? StationName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsAssigned => StationId.HasValue;
    }
}