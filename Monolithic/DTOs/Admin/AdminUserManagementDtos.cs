using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Admin
{
    /// <summary>
    /// DTO for assigning roles to users
    /// </summary>
    public class AssignRoleRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        public string? Reason { get; set; }
    }

    /// <summary>
    /// DTO for removing roles from users
    /// </summary>
    public class RemoveRoleRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        public string? Reason { get; set; }
    }

    /// <summary>
    /// DTO for soft deleting users
    /// </summary>
    public class SoftDeleteUserRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        public string? Reason { get; set; }
    }

    /// <summary>
    /// DTO for restoring deleted users
    /// </summary>
    public class RestoreUserRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for role assignment operations
    /// </summary>
    public class RoleAssignmentResponseDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? OldRole { get; set; }
        public string? NewRole { get; set; }
        public string ActionType { get; set; } = string.Empty; // "Assign", "Remove", "Delete", "Restore"
        public string PerformedBy { get; set; } = "Admin";
        public DateTime ActionAt { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for listing deactivated users
    /// </summary>
    public class DeletedUserDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public DateTime? DeactivatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
