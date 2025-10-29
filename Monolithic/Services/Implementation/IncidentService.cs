using Microsoft.EntityFrameworkCore;
using Monolithic.Data;
using Monolithic.DTOs.Incident.Request;
using Monolithic.DTOs.Incident.Response;
using Monolithic.Models;
using Monolithic.Services.Interfaces;
using System.Text.Json;

namespace Monolithic.Services.Implementation
{
    public class IncidentService : IIncidentService
    {
        private readonly EVStationBasedRentalSystemDbContext _context;
        private readonly IPhotoService _photoService;

        public IncidentService(
            EVStationBasedRentalSystemDbContext context, 
            IPhotoService photoService)
        {
            _context = context;
            _photoService = photoService;
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

            // Tạo incident
            var incident = new Incident
            {
                BookingId = request.BookingId,
                Description = request.Description,
                ReportedAt = DateTime.UtcNow,
                Status = "Pending",
                ReportedBy = request.ReportedBy,
                StationId = booking.StationId
            };

            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync();

            // Upload images nếu có
            if (request.Images != null && request.Images.Any())
            {
                var imageUrls = await UploadImagesToCloudinaryAsync(request.Images, incident.Id);
                incident.Images = JsonSerializer.Serialize(imageUrls);
                await _context.SaveChangesAsync();
            }

            return MapToResponse(incident);
        }

        public async Task<IncidentResponse?> UpdateIncidentAsync(int id, UpdateIncidentFormRequest request, int userId, string userRole)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return null;

            // Only Staff and Admin can update incidents
            if (userRole != "Staff" && userRole != "Admin")
            {
                throw new UnauthorizedAccessException("Only staff and admin can update incidents");
            }

            // Xử lý ảnh
            List<ImageInfo> currentImages = new List<ImageInfo>();
            if (!string.IsNullOrEmpty(incident.Images))
            {
                currentImages = JsonSerializer.Deserialize<List<ImageInfo>>(incident.Images) ?? new List<ImageInfo>();
            }

            // Xóa ảnh cũ nếu có
            if (request.ImagesToRemove != null && request.ImagesToRemove.Any())
            {
                await RemoveImagesFromCloudinaryAsync(request.ImagesToRemove, currentImages);
                currentImages = currentImages.Where(img => !request.ImagesToRemove.Contains(img.Url)).ToList();
            }

            // Thêm ảnh mới
            if (request.NewImages != null && request.NewImages.Any())
            {
                var uploadedImages = await UploadImagesToCloudinaryAsync(request.NewImages, id);
                currentImages.AddRange(uploadedImages);
            }

            // Cập nhật danh sách ảnh
            incident.Images = JsonSerializer.Serialize(currentImages);

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

            await _context.SaveChangesAsync();

            return MapToResponse(incident);
        }

        // Upload images lên Cloudinary
        private async Task<List<ImageInfo>> UploadImagesToCloudinaryAsync(List<IFormFile> images, int incidentId)
        {
            var uploadedImages = new List<ImageInfo>();

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

                    // Validate file size (max 5MB)
                    if (image.Length > 5 * 1024 * 1024)
                    {
                        throw new ArgumentException($"File {image.FileName} is too large. Maximum size is 5MB");
                    }

                    // Upload lên Cloudinary
                    var uploadResult = await _photoService.AddPhotoAsync(image, $"incidents/{incidentId}");

                    if (uploadResult.Error != null)
                    {
                        throw new Exception($"Failed to upload image: {uploadResult.Error.Message}");
                    }

                    // Lưu thông tin ảnh
                    uploadedImages.Add(new ImageInfo
                    {
                        Url = uploadResult.SecureUrl.ToString(),
                        PublicId = uploadResult.PublicId
                    });
                }
            }

            return uploadedImages;
        }

        // Xóa images từ Cloudinary
        private async Task RemoveImagesFromCloudinaryAsync(List<string> imageUrls, List<ImageInfo> currentImages)
        {
            foreach (var imageUrl in imageUrls)
            {
                var imageInfo = currentImages.FirstOrDefault(img => img.Url == imageUrl);
                if (imageInfo != null && !string.IsNullOrEmpty(imageInfo.PublicId))
                {
                    var deletionResult = await _photoService.DeletePhotoAsync(imageInfo.PublicId);
                    
                    if (deletionResult.Error != null)
                    {
                        // Log error nhưng không throw exception
                        Console.WriteLine($"Failed to delete image from Cloudinary: {deletionResult.Error.Message}");
                    }
                }
            }
        }

        private static IncidentResponse MapToResponse(Incident incident)
        {
            List<string> imageUrls = new List<string>();
            
            if (!string.IsNullOrEmpty(incident.Images))
            {
                try
                {
                    var imageInfos = JsonSerializer.Deserialize<List<ImageInfo>>(incident.Images);
                    imageUrls = imageInfos?.Select(img => img.Url).ToList() ?? new List<string>();
                }
                catch
                {
                    // Fallback for old format (plain string array)
                    imageUrls = JsonSerializer.Deserialize<List<string>>(incident.Images) ?? new List<string>();
                }
            }

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
                ReportedBy = incident.ReportedBy,
                StationId = incident.StationId
            };
        }

        public async Task<IncidentListResponse> GetIncidentsAsync(Guid? stationId, string? status, DateTime? dateFrom, DateTime? dateTo, int page = 1, int pageSize = 20)
        {
            var query = _context.Incidents.AsQueryable();

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

        public async Task<IncidentResponse?> GetIncidentByIdAsync(int id, int userId, string userRole)
        {
            var incident = await _context.Incidents
                .FirstOrDefaultAsync(i => i.Id == id);

            if (incident == null) return null;

            // Authorization check
            if (userRole == "Renter" && incident.ReportedBy != userId)
            {
                throw new UnauthorizedAccessException("You can only view your own incidents");
            }

            return MapToResponse(incident);
        }

        public async Task<bool> ResolveIncidentAsync(int id, UpdateIncidentRequest request, int userId)
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

        public async Task<bool> DeleteIncidentAsync(int id)
        {
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null) return false;

            // Xóa tất cả ảnh từ Cloudinary trước khi xóa incident
            if (!string.IsNullOrEmpty(incident.Images))
            {
                try
                {
                    var imageInfos = JsonSerializer.Deserialize<List<ImageInfo>>(incident.Images);
                    if (imageInfos != null && imageInfos.Any())
                    {
                        foreach (var imageInfo in imageInfos)
                        {
                            if (!string.IsNullOrEmpty(imageInfo.PublicId))
                            {
                                await _photoService.DeletePhotoAsync(imageInfo.PublicId);
                            }
                        }
                    }
                }
                catch
                {
                    // Log error nhưng vẫn tiếp tục xóa incident
                    Console.WriteLine("Failed to delete some images from Cloudinary");
                }
            }

            _context.Incidents.Remove(incident);
            await _context.SaveChangesAsync();
            return true;
        }
    }

    // Helper class để lưu thông tin ảnh
    public class ImageInfo
    {
        public string Url { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;
    }
}
