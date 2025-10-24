using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using Monolithic.Models;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation;

public class PhotoService : IPhotoService
{
    private readonly Cloudinary _cloudinary;

    public PhotoService(IOptions<CloudinarySettings> config)
    {
        var acc = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );
        _cloudinary = new Cloudinary(acc);
    }

    public async Task<UploadResult> AddPhotoAsync(IFormFile file, string folderName)
    {
        // Phải dùng ImageUploadResult ở đây vì AddPhotoAsync trả về UploadResult
        // nhưng UploadAsync cụ thể trả về ImageUploadResult
        var uploadResult = new ImageUploadResult();
        if (file.Length > 0)
        {
            using (var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName,
                    Transformation = new Transformation().Width(1000).Height(1000).Crop("limit")
                };
                // Gán kết quả cho uploadResult
                uploadResult = await _cloudinary.UploadAsync(uploadParams);
            }
        }
        return uploadResult; // Trả về ImageUploadResult (nó kế thừa từ UploadResult)
    }

    public async Task<DeletionResult> DeletePhotoAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);
        // Đổi tên biến 'result' thành 'deletionResult' để rõ nghĩa hơn
        var deletionResult = await _cloudinary.DestroyAsync(deleteParams);
        return deletionResult;
    }
}
