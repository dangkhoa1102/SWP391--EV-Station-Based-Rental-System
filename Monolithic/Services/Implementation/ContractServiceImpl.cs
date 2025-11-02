using AutoMapper;
using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using OpenXmlPowerTools;
using DocumentFormat.OpenXml.Packaging;
using Microsoft.Extensions.Configuration;

namespace Monolithic.Services.Implementation
{
    public class ContractServiceImpl : IContractService
    {
        private readonly IContractRepository _contractRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ICarRepository _carRepository;
        private readonly IContractEmailService _emailService;
        private readonly IHostEnvironment _env;
        private readonly IMapper _mapper;
        private readonly ILogger<ContractServiceImpl> _logger;
        private readonly IConfiguration _configuration;

        // token lifetime in hours
        private const int TokenLifetimeHours = 24;

        public ContractServiceImpl(
            IContractRepository contractRepository,
            IBookingRepository bookingRepository,
            ICarRepository carRepository,
            IContractEmailService emailService,
            IHostEnvironment env,
            IMapper mapper,
            ILogger<ContractServiceImpl> logger,
            IConfiguration configuration)
        {
            _contractRepository = contractRepository;
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _emailService = emailService;
            _env = env;
            _mapper = mapper;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Lưu hợp đồng thuê xe và tạo file Word từ template
        /// </summary>
        public async Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request, Guid bookingId, Guid renterId)
        {
            var ngayTao = DateTime.UtcNow;
            DateTime? ngayHetHan = null;

            // Tính ngày hết hạn dựa trên đơn vị thời hạn
            if (request.DonViThoiHan.ToLower() == "thang")
            {
                ngayHetHan = ngayTao.AddMonths(request.ThoiHanThue);
            }
            else if (request.DonViThoiHan.ToLower() == "ngay")
            {
                ngayHetHan = ngayTao.AddDays(request.ThoiHanThue);
            }

            // Tạo entity hợp đồng
            var contractEntity = new Contract
            {
                ContractId = Guid.NewGuid(),
                BookingId = bookingId,
                RenterId = renterId,
                SoHopDong = request.SoHopDong,
                HoTenBenA = request.BenA.HoTen,
                BienSoXe = request.Xe.BienSo,
                NgayTao = ngayTao,
                NgayHetHan = ngayHetHan,
                Status = ContractStatus.Pending,
                ContractContent = "Generated from HopDong template",
                ContractContentHash = ComputeSha256Hash("Generated from HopDong template")
            };

            // Tạo file Word từ template
            var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "hopdongthuexe.docx");
            
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException($"Template file not found at: {templatePath}");
            }

            try
            {
                // Copy template to working copy
                var tempFilePath = Path.Combine(_env.ContentRootPath, "Storage", $"{contractEntity.ContractId}_temp.docx");
                Directory.CreateDirectory(Path.GetDirectoryName(tempFilePath));
                File.Copy(templatePath, tempFilePath, true);

                // Replace placeholders in the document
                // Đảm bảo placeholders khớp chính xác với template DOCX
                await ReplaceTextInDocumentAsync(tempFilePath, new Dictionary<string, string>
                {
                    // Số hợp đồng
                    { "{{so_hop_dong}}", request.SoHopDong },
                    
                    // Ngày ký hợp đồng
                    { "{{ngay_ky}}", request.NgayKy },
                    { "{{thang_ky}}", request.ThangKy },
                    { "{{nam_ky}}", request.NamKy },
                    
                    // Thông tin Bên A (người cho thuê)
                    { "{{HO_TEN_BEN_A}}", request.BenA.HoTen },
                    { "{{nam_sinh_ben_a}}", request.BenA.NamSinh },
                    { "{{cccd_hoac_ho_chieu_ben_a}}", request.BenA.CccdHoacHoChieu },
                    { "{{ho_khau_thuong_tru}}", request.BenA.HoKhauThuongTru },
                    
                    // Thông tin xe
                    { "{{nhan_hieu}}", request.Xe.NhanHieu },
                    { "{{bien_so}}", request.Xe.BienSo },
                    { "{{loai_xe}}", request.Xe.LoaiXe },
                    { "{{mau_son}}", request.Xe.MauSon },
                    { "{{cho_ngoi}}", request.Xe.ChoNgoi },
                    { "{{xe_dang_ki_han}}", request.Xe.XeDangKiHan },
                    
                    // Thông tin GPLX
                    { "{{gplx_hang}}", request.GPLX.Hang },
                    { "{{gplx_so}}", request.GPLX.So },
                    { "{{gplx_han_su_dung}}", request.GPLX.HanSuDung },
                    
                    // Thời hạn thuê
                    { "{{thoi_han_thue_so}}", request.ThoiHanThueSo },
                    { "{{thoi_han_thue_chu}}", request.ThoiHanThueChu },
                    
                    // Giá thuê và thanh toán
                    { "{{gia_thue_so}}", request.GiaThue.GiaThueSo },
                    { "{{gia_thue_chu}}", request.GiaThue.GiaThueChu },
                    { "{{phuong_thuc_thanh_toan}}", request.GiaThue.PhuongThucThanhToan },
                    { "{{ngay_thanh_toan}}", request.GiaThue.NgayThanhToan }
                });

                // Move to final location
                var finalFilePath = Path.Combine(_env.ContentRootPath, "Storage", $"{contractEntity.ContractId}.docx");
                File.Move(tempFilePath, finalFilePath, true);

                // Lưu contract vào database
                await _contractRepository.AddAsync(contractEntity);
                _logger.LogInformation("Created contract {ContractId} for booking {BookingId}", contractEntity.ContractId, bookingId);

                return contractEntity.ContractId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating contract document");
                throw;
            }
        }

        /// <summary>
        /// Thay thế text trong Word document sử dụng DocumentFormat.OpenXml
        /// </summary>
        private async Task ReplaceTextInDocumentAsync(string filePath, Dictionary<string, string> replacements)
        {
            await Task.Run(() =>
            {
                using (var doc = WordprocessingDocument.Open(filePath, true))
                {
                    var mainPart = doc.MainDocumentPart;
                    if (mainPart == null) return;

                    var document = mainPart.Document;
                    var body = document.Body;
                    if (body == null) return;

                    // Get all text as a single string to handle placeholders that span multiple runs
                    var fullText = body.InnerText;
                    
                    // Check if replacements are needed
                    bool needsReplacement = false;
                    foreach (var replacement in replacements)
                    {
                        if (fullText.Contains(replacement.Key))
                        {
                            needsReplacement = true;
                            break;
                        }
                    }

                    if (!needsReplacement)
                    {
                        _logger.LogWarning("No placeholders found in document. Full text: {FullText}", fullText.Substring(0, Math.Min(200, fullText.Length)));
                        return;
                    }

                    // Strategy: Concatenate all text runs in each paragraph, then replace
                    foreach (var paragraph in document.Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
                    {
                        // Get all text runs in this paragraph
                        var runs = paragraph.Descendants<DocumentFormat.OpenXml.Wordprocessing.Run>().ToList();
                        if (runs.Count == 0) continue;

                        // Build full paragraph text
                        var paragraphText = new StringBuilder();
                        foreach (var run in runs)
                        {
                            var textElements = run.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().ToList();
                            foreach (var textElement in textElements)
                            {
                                paragraphText.Append(textElement.Text);
                            }
                        }

                        var originalText = paragraphText.ToString();
                        var modifiedText = originalText;

                        // Apply all replacements
                        foreach (var replacement in replacements)
                        {
                            modifiedText = modifiedText.Replace(replacement.Key, replacement.Value ?? "");
                        }

                        // If text changed, update the paragraph
                        if (modifiedText != originalText)
                        {
                            // Remove all existing runs
                            runs.ForEach(r => r.Remove());

                            // Create a new run with the replaced text
                            var newRun = new DocumentFormat.OpenXml.Wordprocessing.Run();
                            var newText = new DocumentFormat.OpenXml.Wordprocessing.Text(modifiedText);
                            newRun.Append(newText);
                            paragraph.Append(newRun);

                            _logger.LogDebug("Replaced text in paragraph: {Original} -> {Modified}", 
                                originalText.Substring(0, Math.Min(50, originalText.Length)), 
                                modifiedText.Substring(0, Math.Min(50, modifiedText.Length)));
                        }
                    }

                    mainPart.Document.Save();
                    _logger.LogInformation("Successfully replaced {Count} placeholders in document", replacements.Count);
                }
            });
        }

        /// <summary>
        /// Gửi email xác nhận hợp đồng
        /// </summary>
        public async Task GuiEmailXacNhanAsync(Guid contractId, string email)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null || contract.Status != ContractStatus.Pending)
            {
                throw new InvalidOperationException("Hợp đồng không tồn tại hoặc đã được xử lý.");
            }

            // Tạo token và thời gian hết hạn
            contract.ConfirmationToken = Guid.NewGuid().ToString("N");
            contract.TokenExpiry = DateTime.UtcNow.AddHours(TokenLifetimeHours);

            // Cập nhật hợp đồng với token mới
            await _contractRepository.UpdateAsync(contract);

            // Lấy URL từ configuration
            var frontendBaseUrl = _configuration["AppSettings:FrontendBaseUrl"] ?? "http://localhost:3000";
            var backendBaseUrl = _configuration["AppSettings:BackendBaseUrl"] ?? "https://localhost:7184";

            // Tạo link xác nhận
            var confirmationLink = $"{frontendBaseUrl}/xac-nhan-hop-dong?token={contract.ConfirmationToken}";

            // Tạo link download file hợp đồng
            //var downloadLink = $"{backendBaseUrl}/api/contracts/hopdong/download/{contract.ConfirmationToken}";
            var downloadLink = $"{frontendBaseUrl}/api/contracts/user/download-latest-by-userId";

            // Gửi email với cả 2 link
            await _emailService.SendConfirmationEmailAsync(email, confirmationLink, downloadLink);
            _logger.LogInformation("Sent confirmation email for contract {ContractId} to {Email}", contractId, email);
        }

        /// <summary>
        /// Lấy hợp đồng để xác nhận (chuyển sang HTML)
        /// </summary>
        public async Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token)
        {
            var contract = await _contractRepository.GetByConfirmationTokenAsync(token);
            if (contract == null || contract.TokenExpiry < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Link không hợp lệ hoặc đã hết hạn.");
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"Contract file not found: {docxPath}");
            }

            var docxBytes = await File.ReadAllBytesAsync(docxPath);

            // Chuyển DOCX sang HTML
            var settings = new WmlToHtmlConverterSettings();
            var wmlDoc = new WmlDocument(docxPath, docxBytes);
            var htmlElement = WmlToHtmlConverter.ConvertToHtml(wmlDoc, settings);
            var htmlString = htmlElement.ToString(System.Xml.Linq.SaveOptions.DisableFormatting);

            return new HopDongXacNhanDto(contract.SoHopDong ?? "N/A", contract.HoTenBenA ?? "N/A", contract.NgayTao, htmlString);
        }

        /// <summary>
        /// Xác nhận và ký hợp đồng
        /// </summary>
        public async Task XacNhanKyHopDongAsync(string token)
        {
            var contract = await _contractRepository.GetByConfirmationTokenAsync(token);
            if (contract == null)
            {
                throw new InvalidOperationException("Token xác nhận không tồn tại.");
            }

            if (contract.Status == ContractStatus.Signed)
            {
                throw new InvalidOperationException("Hợp đồng này đã được ký trước đó.");
            }

            if (contract.Status == ContractStatus.Expired || (contract.TokenExpiry.HasValue && contract.TokenExpiry < DateTime.UtcNow))
            {
                if (contract.Status != ContractStatus.Expired)
                {
                    contract.Status = ContractStatus.Expired;
                    await _contractRepository.UpdateAsync(contract);
                }
                throw new InvalidOperationException("Link xác nhận đã hết hạn.");
            }

            contract.Status = ContractStatus.Signed;
            contract.NgayKy = DateTime.UtcNow;
            contract.ConfirmationToken = null;
            contract.IsConfirmed = true;
            contract.ConfirmedAt = DateTime.UtcNow;

            await _contractRepository.UpdateAsync(contract);
            _logger.LogInformation("Contract {ContractId} signed at {NgayKy}", contract.ContractId, contract.NgayKy);
        }

        /// <summary>
        /// Xóa mềm hợp đồng
        /// </summary>
        public async Task XoaMemHopDongAsync(Guid id)
        {
            var contract = await _contractRepository.GetByIdAsync(id);
            if (contract == null)
            {
                throw new InvalidOperationException("Không tìm thấy hợp đồng.");
            }

            contract.IsDeleted = true;
            await _contractRepository.UpdateAsync(contract);
            _logger.LogInformation("Contract {ContractId} marked as deleted", id);
        }

        /// <summary>
        /// Lấy hợp đồng theo token xác nhận
        /// </summary>
        public async Task<ContractDto> GetContractByTokenAsync(string token)
        {
            var contract = await _contractRepository.GetByTokenAsync(token);
            if (contract == null)
            {
                throw new InvalidOperationException("Hợp đồng không tồn tại.");
            }

            return _mapper.Map<ContractDto>(contract);
        }

        /// <summary>
        /// Lấy hợp đồng đã ký để xem lại (HTML)
        /// </summary>
        public async Task<HopDongXacNhanDto> LayHopDongDaKyAsync(Guid contractId)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null)
            {
                throw new InvalidOperationException("Hợp đồng không tồn tại.");
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"Contract file not found: {docxPath}");
            }

            var docxBytes = await File.ReadAllBytesAsync(docxPath);

            // Chuyển DOCX sang HTML
            var settings = new WmlToHtmlConverterSettings();
            var wmlDoc = new WmlDocument(docxPath, docxBytes);
            var htmlElement = WmlToHtmlConverter.ConvertToHtml(wmlDoc, settings);
            var htmlString = htmlElement.ToString(System.Xml.Linq.SaveOptions.DisableFormatting);

            return new HopDongXacNhanDto(
                contract.SoHopDong ?? "N/A", 
                contract.HoTenBenA ?? "N/A", 
                contract.NgayTao, 
                htmlString
            );
        }

        /// <summary>
        /// Download file hợp đồng DOCX
        /// </summary>
        public async Task<byte[]> DownloadHopDongFileAsync(Guid contractId)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null)
            {
                throw new InvalidOperationException("Hợp đồng không tồn tại.");
            }

            if (contract.IsDeleted)
            {
                throw new InvalidOperationException("Hợp đồng đã bị xóa.");
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"Contract file not found: {docxPath}");
            }

            var fileBytes = await File.ReadAllBytesAsync(docxPath);
            _logger.LogInformation("Contract file {ContractId} downloaded", contractId);
            
            return fileBytes;
        }

        /// <summary>
        /// Download file hợp đồng bằng token (cho email link)
        /// </summary>
        public async Task<(byte[] FileBytes, string FileName)> DownloadHopDongFileByTokenAsync(string token)
        {
            var contract = await _contractRepository.GetByConfirmationTokenAsync(token);
            if (contract == null)
            {
                throw new InvalidOperationException("Token không hợp lệ hoặc đã hết hạn.");
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"Contract file not found: {docxPath}");
            }

            var fileBytes = await File.ReadAllBytesAsync(docxPath);
            var fileName = $"HopDong_{contract.SoHopDong}_{DateTime.Now:yyyyMMdd}.docx";
            
            _logger.LogInformation("Contract file downloaded via token for contract {ContractId}", contract.ContractId);
            
            return (fileBytes, fileName);
        }

        /// <summary>
        /// Download file hợp đồng theo ContractId với kiểm tra quyền truy cập
        /// </summary>
        public async Task<(byte[] FileBytes, string FileName)> DownloadHopDongFileByContractIdAsync(Guid contractId, Guid? currentUserId, string? userRole)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null)
            {
                throw new InvalidOperationException("Hợp đồng không tồn tại.");
            }

            if (contract.IsDeleted)
            {
                throw new InvalidOperationException("Hợp đồng đã bị xóa.");
            }

            // Kiểm tra quyền truy cập:
            // - Admin có thể download mọi hợp đồng
            // - Staff có thể download hợp đồng mà họ tham gia (StaffId)
            // - Customer chỉ có thể download hợp đồng của chính họ (RenterId)
            if (userRole != "Admin")
            {
                if (currentUserId == null)
                {
                    throw new UnauthorizedAccessException("Bạn cần đăng nhập để tải hợp đồng.");
                }

                bool hasAccess = false;

                // Staff có thể download nếu họ là staff của hợp đồng này
                if (userRole == "Staff" && contract.StaffId.HasValue && contract.StaffId.Value == currentUserId.Value)
                {
                    hasAccess = true;
                }

                // Customer có thể download nếu họ là người thuê
                if (userRole == "Customer" && contract.RenterId == currentUserId.Value)
                {
                    hasAccess = true;
                }

                if (!hasAccess)
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền tải hợp đồng này.");
                }
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"File hợp đồng không tồn tại: {docxPath}");
            }

            var fileBytes = await File.ReadAllBytesAsync(docxPath);
            var fileName = $"HopDong_{contract.SoHopDong}_{DateTime.Now:yyyyMMdd}.docx";
            
            _logger.LogInformation("Contract file {ContractId} downloaded by user {UserId} with role {Role}", 
                contractId, currentUserId, userRole);
            
            return (fileBytes, fileName);
        }

        /// <summary>
        /// Download hợp đồng mới nhất của user theo RenterId
        /// </summary>
        public async Task<(byte[] FileBytes, string FileName)> DownloadLatestContractByUserIdAsync(Guid userId, Guid? currentUserId, string? userRole)
        {
            // Kiểm tra quyền: chỉ user đó hoặc admin mới được download
            //if (userRole != "Admin" && currentUserId != userId)
            //{
            //    throw new UnauthorizedAccessException("Bạn chỉ có thể tải hợp đồng của chính mình.");
            //}

            // Tìm hợp đồng mới nhất của user (RenterId)
            var contracts = await _contractRepository.GetByRenterIdAsync(userId);
            var latestContract = contracts
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.NgayTao)
                .FirstOrDefault();

            if (latestContract == null)
            {
                throw new InvalidOperationException("Không tìm thấy hợp đồng nào cho user này.");
            }

            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{latestContract.ContractId}.docx");
            if (!File.Exists(docxPath))
            {
                throw new FileNotFoundException($"File hợp đồng không tồn tại: {docxPath}");
            }

            var fileBytes = await File.ReadAllBytesAsync(docxPath);
            var fileName = $"HopDong_{latestContract.SoHopDong}_{DateTime.Now:yyyyMMdd}.docx";
            
            _logger.LogInformation("Latest contract downloaded by user {UserId} for renter {RenterId}", 
                currentUserId, userId);
            
            return (fileBytes, fileName);
        }

        public async Task<ResponseDto<ContractDto>> CreateContractAsync(CreateContractDto request)
        {
            // Validate booking exists
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null)
            {
                return ResponseDto<ContractDto>.Failure("Booking not found");
            }

            // prevent multiple drafts for same booking
            var existing = await _contractRepository.FirstOrDefaultAsync(c => c.BookingId == request.BookingId && !c.IsConfirmed);
            if (existing != null)
            {
                return ResponseDto<ContractDto>.Failure("A draft contract for this booking already exists");
            }

            if (string.IsNullOrWhiteSpace(request.ContractContent))
            {
                return ResponseDto<ContractDto>.Failure("Contract content is required");
            }

            var contentHash = ComputeSha256Hash(request.ContractContent);

            var entity = new Contract
            {
                ContractId = Guid.NewGuid(),
                BookingId = request.BookingId,
                RenterId = request.RenterId,
                StaffId = request.StaffId,
                ContractContent = request.ContractContent,
                ContractContentHash = contentHash,
                SignatureType = string.IsNullOrWhiteSpace(request.SignatureValue) ? "EmailConfirmation" : "TypedName",
                SignatureValue = request.SignatureValue,
                SignerEmail = request.SignerEmail,
                CreatedAt = DateTime.UtcNow
            };

            var saved = await _contractRepository.AddAsync(entity);
            var dto = _mapper.Map<ContractDto>(saved);
            return ResponseDto<ContractDto>.Success(dto);
        }

        public async Task<ResponseDto<ContractDto>> GetContractByBookingIdAsync(Guid bookingId)
        {
            var contract = await _contractRepository.GetByBookingIdAsync(bookingId);
            if (contract == null) return ResponseDto<ContractDto>.Failure("Contract not found");
            return ResponseDto<ContractDto>.Success(_mapper.Map<ContractDto>(contract));
        }

        public async Task<ResponseDto<string>> RequestConfirmationAsync(Guid contractId, string email)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null) return ResponseDto<string>.Failure("Contract not found");
            if (contract.IsConfirmed) return ResponseDto<string>.Failure("Contract already confirmed");

            if (string.IsNullOrWhiteSpace(email)) return ResponseDto<string>.Failure("Email is required");

            // generate token
            var tokenBytes = RandomNumberGenerator.GetBytes(48);
            var token = Convert.ToBase64String(tokenBytes);
            var tokenHash = ComputeSha256Hash(token);

            contract.ConfirmationTokenHash = tokenHash;
            contract.TokenExpiresAt = DateTime.UtcNow.AddHours(TokenLifetimeHours);
            contract.SignerEmail = email;
            await _contractRepository.UpdateAsync(contract);

            _logger.LogInformation("Generated confirmation token for contract {ContractId}", contractId);
            return ResponseDto<string>.Success(token, "Confirmation token generated");
        }

        public async Task<ResponseDto<ContractDto>> ConfirmContractAsync(Guid contractId, string token, string requesterIp, string userAgent)
        {
            var contract = await _contractRepository.GetByIdAsync(contractId);
            if (contract == null) return ResponseDto<ContractDto>.Failure("Contract not found");
            if (contract.IsConfirmed) return ResponseDto<ContractDto>.Failure("Contract already confirmed");
            if (string.IsNullOrWhiteSpace(contract.ConfirmationTokenHash) || !contract.TokenExpiresAt.HasValue)
                return ResponseDto<ContractDto>.Failure("No pending confirmation for this contract");

            if (DateTime.UtcNow > contract.TokenExpiresAt.Value) return ResponseDto<ContractDto>.Failure("Confirmation token expired");

            var tokenHash = ComputeSha256Hash(token);
            if (!SecureEquals(tokenHash, contract.ConfirmationTokenHash)) return ResponseDto<ContractDto>.Failure("Invalid confirmation token");

            contract.IsConfirmed = true;
            contract.ConfirmedAt = DateTime.UtcNow;
            contract.ConfirmedFromIp = requesterIp;
            contract.ConfirmedUserAgent = userAgent;
            contract.ConfirmationTokenHash = null;
            contract.TokenExpiresAt = null;
            await _contractRepository.UpdateAsync(contract);

            return ResponseDto<ContractDto>.Success(_mapper.Map<ContractDto>(contract), "Contract confirmed");
        }

        public async Task<ResponseDto<List<ContractDto>>> GetContractsByRenterAsync(Guid renterId)
        {
            var contracts = await _contractRepository.GetByRenterIdAsync(renterId);
            return ResponseDto<List<ContractDto>>.Success(contracts.Select(c => _mapper.Map<ContractDto>(c)).ToList());
        }

        public async Task<ResponseDto<ContractDto>> FillContractAsync(Monolithic.DTOs.Contract.FillContractFieldsDto request, Guid callerUserId, string callerRole)
        {
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null) return ResponseDto<ContractDto>.Failure("Booking not found");

            if (callerRole == "Customer")
            {
                if (booking.UserId != callerUserId || request.RenterId != callerUserId)
                    return ResponseDto<ContractDto>.Failure("Forbidden");
            }

            if (request.EndTime.HasValue && request.EndTime <= request.StartTime)
                return ResponseDto<ContractDto>.Failure("EndTime must be after StartTime");

            var car = await _carRepository.GetByIdAsync(request.CarId);
            if (car == null || !car.IsActive) return ResponseDto<ContractDto>.Failure("Car not found or inactive");

            string San(string? s) => string.IsNullOrWhiteSpace(s) ? string.Empty : s.Trim();

            var map = new Dictionary<string, string>
            {
                ["FullName"] = San(request.FullName),
                ["IdNumber"] = San(request.IdNumber),
                ["DriverLicenseNumber"] = San(request.DriverLicenseNumber),
                ["PhoneNumber"] = San(request.PhoneNumber),
                ["Car"] = $"{car.Brand} {car.Model} ({car.LicensePlate})",
                ["StartTime"] = request.StartTime.ToString("u"),
                ["EndTime"] = request.EndTime?.ToString("u") ?? string.Empty,
                ["EstimatedAmount"] = request.EstimatedAmount.ToString("F2"),
                ["AdditionalNotes"] = San(request.AdditionalNotes)
            };

            var template = "HỢP ĐỒNG THUÊ XE\nNguời thuê: {{FullName}}\nCMND/CCCD: {{IdNumber}}\nBằng lái: {{DriverLicenseNumber}}\nSĐT: {{PhoneNumber}}\nXe: {{Car}}\nThời gian: {{StartTime}} - {{EndTime}}\nPhí dự tính: {{EstimatedAmount}}\nGhi chú: {{AdditionalNotes}}\n";

            foreach (var kv in map)
            {
                template = template.Replace("{{" + kv.Key + "}}", kv.Value);
            }

            var contentHash = ComputeSha256Hash(template);

            var draft = new Contract
            {
                ContractId = Guid.NewGuid(),
                BookingId = request.BookingId,
                RenterId = request.RenterId,
                ContractContent = template,
                ContractContentHash = contentHash,
                SignerEmail = request.SignerEmail,
                IsConfirmed = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var contract = await _contractRepository.UpsertDraftAsync(draft);

            return ResponseDto<ContractDto>.Success(_mapper.Map<ContractDto>(contract));
        }

        // Helpers
        private static string ComputeSha256Hash(string raw)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(raw);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToHexString(hash);
        }

        private static bool SecureEquals(string hexA, string hexB)
        {
            try
            {
                var a = Convert.FromHexString(hexA);
                var b = Convert.FromHexString(hexB);
                return CryptographicOperations.FixedTimeEquals(a, b);
            }
            catch
            {
                return false;
            }
        }
    }
}
