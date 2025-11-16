using Microsoft.EntityFrameworkCore;
using Monolithic.Common;
using Monolithic.Data;
using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;
using Monolithic.Models;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation
{
    public class IncidentService : IIncidentService
    {
        private readonly EVStationBasedRentalSystemDbContext _context;
        private readonly IPhotoService _photoService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        //private readonly IDiscordNotifier _notifier;

        public IncidentService(
            EVStationBasedRentalSystemDbContext context, 
            IPhotoService photoService,
            IHttpContextAccessor httpContextAccessor
            /*IDiscordNotifier notifier*/)
        {
            _context = context;
            _photoService = photoService;
            _httpContextAccessor = httpContextAccessor;
            //_notifier = notifier;
        }

        public async Task<IncidentResponse> CreateIncidentAsync(CreateIncidentFormRequest request)
        {
            // Validate booking exists
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

            if (booking == null)
            {
                throw new ArgumentException("Booking not found");
            }

            // Get staff who creates this incident (must be authenticated)
            var staffIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !Guid.TryParse(staffIdClaim, out var staffGuid))
            {
                throw new UnauthorizedAccessException("Chỉ nhân viên được phép tạo sự cố");
            }

            if (booking.BookingStatus != BookingStatus.CheckedIn)
            {
                throw new InvalidOperationException("Chỉ có thể báo cáo sự cố cho các booking đang trong trạng thái 'CheckedIn'");
            }

            // Tạo incident
            var incident = new Incident
            {
                BookingId = request.BookingId,
                Description = request.Description,
                ReportedAt = DateTime.UtcNow,
                Status = "Pending",
                // Do not auto-assign StationId here so admin can assign explicitly later
                StationId = null,
                StaffId = staffGuid
            };

            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync();
//            await _notifier.SendMessageAsync(
//    $"🚨 **New Incident Created!**\n" +
//    $"📋 Booking ID: `{incident.BookingId}`\n" +
//    $"🧍‍♂️ Staff: `{staffGuid}`\n" +
//    $"🕐 Reported At: {incident.ReportedAt:HH:mm:ss dd/MM/yyyy UTC}\n" +
//    $"💬 Description: {incident.Description}"
//);

            // Upload images nếu có
            if (request.Images != null && request.Images.Any())
            {
                var (imageUrls, publicIds) = await UploadImagesToCloudinaryAsync(request.Images);
                incident.ImageUrls = string.Join(";", imageUrls);
                incident.ImagePublicIds = string.Join(";", publicIds);
                await _context.SaveChangesAsync();
            }

            return MapToResponse(incident);
        }

        public async Task<IncidentResponse?> UpdateIncidentAsync(Guid id, UpdateIncidentFormRequest request, Guid userId, string userRole)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return null;

            // Only Staff and Admin can update incidents
            if (userRole != "Staff" && userRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only staff and admin can update incidents");
            }

            var currentImageUrls = string.IsNullOrEmpty(incident.ImageUrls) 
                ? new List<string>() 
                : incident.ImageUrls.Split(";").ToList();
            var currentPublicIds = string.IsNullOrEmpty(incident.ImagePublicIds) 
                ? new List<string>() 
                : incident.ImagePublicIds.Split(";").ToList();

            // Xóa ảnh cũ nếu có
            if (request.ImagesToRemove != null && request.ImagesToRemove.Any())
            {
                for (int i = 0; i < currentImageUrls.Count; i++)
                {
                    if (request.ImagesToRemove.Contains(currentImageUrls[i]))
                    {
                        // Xóa từ Cloudinary
                        if (i < currentPublicIds.Count && !string.IsNullOrEmpty(currentPublicIds[i]))
                        {
                            await _photoService.DeletePhotoAsync(currentPublicIds[i]);
                        }
                    }
                }
                
                // Lọc bỏ ảnh bị xóa
                currentImageUrls = currentImageUrls.Where(url => !request.ImagesToRemove.Contains(url)).ToList();
                currentPublicIds = currentPublicIds.Where((id, index) => 
                    index < currentImageUrls.Count || !request.ImagesToRemove.Contains(currentImageUrls.ElementAtOrDefault(index) ?? "")).ToList();
            }

            // Thêm ảnh mới
            if (request.NewImages != null && request.NewImages.Any())
            {
                var (newUrls, newPublicIds) = await UploadImagesToCloudinaryAsync(request.NewImages);
                currentImageUrls.AddRange(newUrls);
                currentPublicIds.AddRange(newPublicIds);
            }

            incident.ImageUrls = string.Join(";", currentImageUrls);
            incident.ImagePublicIds = string.Join(";", currentPublicIds);

            // Update các field khác
            if (!string.IsNullOrEmpty(request.Status))
            {
                incident.Status = request.Status;

                // If status is resolved, set ResolvedAt
                if (request.Status == "Resolved" && !incident.ResolvedAt.HasValue)
                {
                    incident.ResolvedAt = DateTime.UtcNow;
                    incident.ResolvedBy = userId;
                }
            }

            if (request.ResolutionNotes != null)
            {
                incident.ResolutionNotes = request.ResolutionNotes;
            }

            if (request.CostIncurred.HasValue)
            {
                incident.CostIncurred = request.CostIncurred.Value;
            }

            if (request.ResolvedBy.HasValue && userRole == "Admin")
            {
                incident.ResolvedBy = request.ResolvedBy.Value;
            }

            // Allow Admin to assign/change the station for this incident
            if (userRole == "Admin")
            {
                if (request is UpdateIncidentFormRequest updReq && updReq.StationId.HasValue)
                {
                    incident.StationId = updReq.StationId.Value;
                }
            }

        

            await _context.SaveChangesAsync();

            return MapToResponse(incident);
        }

        private async Task<(List<string> urls, List<string> publicIds)> UploadImagesToCloudinaryAsync(List<IFormFile> images)
        {
            var uploadedUrls = new List<string>();
            var uploadedPublicIds = new List<string>();

            foreach (var image in images)
            {
                if (image.Length > 0)
                {
                    // Validate file type
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                    var fileExtension = Path.GetExtension(image.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        throw new ArgumentException($"File type {fileExtension} is not allowed");
                    }

                    // Validate file size (max 25MB)
                    const long maxFileSize = 25 * 1024 * 1024; // 25MB
                    if (image.Length > maxFileSize)
                    {
                        throw new ArgumentException($"File {image.FileName} is too large. Maximum size is 25MB");
                    }

                    // Upload lên Cloudinary
                    var uploadResult = await _photoService.AddPhotoAsync(image, "rental_app/incidents");

                    if (uploadResult.Error != null)
                    {
                        throw new Exception($"Failed to upload image: {uploadResult.Error.Message}");
                    }

                    // Lưu thông tin ảnh
                    uploadedUrls.Add(uploadResult.SecureUrl.ToString());
                    uploadedPublicIds.Add(uploadResult.PublicId);
                }
            }

            return (uploadedUrls, uploadedPublicIds);
        }

        private static IncidentResponse MapToResponse(Incident incident)
        {
            var imageUrls = string.IsNullOrEmpty(incident.ImageUrls) 
                ? new List<string>() 
                : incident.ImageUrls.Split(";").Where(u => !string.IsNullOrWhiteSpace(u)).ToList();

            var renterName = incident.Booking?.User?.FullName;
            var renterPhone = incident.Booking?.User?.PhoneNumber;

            return new IncidentResponse
            {
                Id = incident.Id,
                BookingId = incident.BookingId,
                Description = incident.Description,
                Images = imageUrls,
                ReportedAt = incident.ReportedAt,
                ResolvedAt = incident.ResolvedAt,
                Status = incident.Status,
                ResolutionNotes = incident.ResolutionNotes,
                CostIncurred = incident.CostIncurred,
                ResolvedBy = incident.ResolvedBy,
                StationId = incident.StationId,
                StaffId = incident.StaffId,
                IsDeleted = incident.IsDeleted,
                DeletedAt = incident.DeletedAt,
                DeletedBy = incident.DeletedBy,
                RenterName = renterName,
                RenterPhone = renterPhone
            };
        }

        public async Task<IncidentListResponse> GetIncidentsAsync(Guid? stationId, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 20, Guid userId = default, string userRole = "", bool includeDeleted = false)
        {
            // var query = _context.Incidents.AsQueryable();
            // Eager-load Booking and User so we can return renter contact info
            IQueryable<Incident> query = _context.Incidents
                .Include(i => i.Booking)
                    .ThenInclude(b => b.User)
                .AsQueryable();

            if (includeDeleted)
            {
                query = query.IgnoreQueryFilters();
            }

            // Filter by station
            if (stationId.HasValue)
            {
                query = query.Where(i => i.StationId == stationId.Value);
            }

            // Filter by status
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            // Filter by date range
            if (dateFrom.HasValue)
            {
                query = query.Where(i => i.ReportedAt >= dateFrom.Value);
            }
            if (dateTo.HasValue)
            {
                query = query.Where(i => i.ReportedAt <= dateTo.Value);
            }

            // Pagination
            var totalCount = await query.CountAsync();
            var incidents = await query
                .OrderByDescending(i => i.ReportedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = new IncidentListResponse
            {
                Incidents = incidents.Select(MapToResponse).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return response;
        }

        public async Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid userId, string userRole)
        {
            var incident = await _context.Incidents
                .Include(i => i.Booking)
                    .ThenInclude(b => b.User)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (incident == null) return null;

            // Authorization check - only staff and admin can view incidents
            if (userRole != "Admin" && userRole != "Station Staff")
            {
                throw new UnauthorizedAccessException("Chỉ nhân viên và admin mới có thể xem sự cố");
            }

            return MapToResponse(incident);
        }

        public async Task<bool> ResolveIncidentAsync(Guid id, UpdateIncidentRequest request, Guid userId)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return false;

            incident.Status = "Resolved";
            incident.ResolvedAt = DateTime.UtcNow;
            incident.ResolvedBy = userId;

            if (!string.IsNullOrEmpty(request.ResolutionNotes))
            {
                incident.ResolutionNotes = request.ResolutionNotes;
            }

            if (request.CostIncurred.HasValue)
            {
                incident.CostIncurred = request.CostIncurred.Value;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResolveIncidentQuickAsync(Guid id, Guid userId)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return false;

            incident.Status = "Resolved";
            incident.ResolvedAt = DateTime.UtcNow;
            incident.ResolvedBy = userId;

            await _context.SaveChangesAsync();
            return true;
        }

        // Hard delete incident and associated images
        // public async Task<bool> DeleteIncidentAsync(Guid id, Guid userId)
        // {
        //     var incident = await _context.Incidents.FindAsync(id);
        //     if (incident == null) return false;

        //     // Xóa tất cả ảnh từ Cloudinary trước khi xóa incident
        //     if (!string.IsNullOrEmpty(incident.ImagePublicIds))
        //     {
        //         var publicIds = incident.ImagePublicIds.Split(";", StringSplitOptions.RemoveEmptyEntries);
        //         foreach (var publicId in publicIds)
        //         {
        //             if (!string.IsNullOrWhiteSpace(publicId))
        //             {
        //                 await _photoService.DeletePhotoAsync(publicId);
        //             }
        //         }
        //     }

        //     _context.Incidents.Remove(incident);
        //     await _context.SaveChangesAsync();
        //     return true;
        // }

        public async Task<bool> DeleteIncidentAsync(Guid id, Guid userId)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident is null) return false;

            // Soft delete
            incident.IsDeleted = true;
            incident.DeletedAt = DateTime.UtcNow;
            incident.DeletedBy = userId;

            await _context.SaveChangesAsync();
            return true;
        }

        // public async Task<bool> HardDeleteIncidentAsync(Guid id)
        // {
        //     var incident = await _context.Incidents.FindAsync(id);
        //     if (incident is null) return false;

        //     // delete photos from cloudinary 
        //     _context.Incidents.Remove(incident);
        //     await _context.SaveChangesAsync();
        //     return true;
        // }

        public async Task<IncidentListResponse> GetRenterIncidentsAsync(string renterId, int page = 1, int pageSize = 20)
        {
            if (!Guid.TryParse(renterId, out var renterGuid))
            {
                return new IncidentListResponse
                {
                    Incidents = new List<IncidentResponse>(),
                    TotalCount = 0,
                    Page = page,
                    PageSize = pageSize
                };
            }

            // Lấy incidents từ bookings của renter này
            var query = _context.Incidents
                .Include(i => i.Booking)
                    .ThenInclude(b => b.User)
                .Where(i => i.Booking.UserId == renterGuid);

            var totalCount = await query.CountAsync();
            var incidents = await query
                .OrderByDescending(i => i.ReportedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = new IncidentListResponse
            {
                Incidents = incidents.Select(MapToResponse).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return response;
        }

        public async Task<IncidentListResponse> GetIncidentsByBookingAsync(Guid bookingId, int page = 1, int pageSize = 20)
        {
            var query = _context.Incidents
                .Include(i => i.Booking)
                    .ThenInclude(b => b.User)
                .Where(i => i.BookingId == bookingId);

            var totalCount = await query.CountAsync();
            var incidents = await query
                .OrderByDescending(i => i.ReportedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = new IncidentListResponse
            {
                Incidents = incidents.Select(MapToResponse).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return response;
        }
    }
}
