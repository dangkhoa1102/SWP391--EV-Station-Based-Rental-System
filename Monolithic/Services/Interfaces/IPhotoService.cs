using CloudinaryDotNet.Actions;

namespace Monolithic.Services.Interfaces
{
    public interface IPhotoService
    {
        // Thêm tham số string folderName
        Task<UploadResult> AddPhotoAsync(IFormFile file, string folderName);

        // Thêm hàm xóa ảnh (bạn sẽ cần khi Renter upload lại)
        Task<DeletionResult> DeletePhotoAsync(string publicId);
    }
}
