using AutoMapper;
using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Monolithic.Services.Implementation
{
    public class ContractServiceImpl : IContractService
    {
        private readonly IContractRepository _contractRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ICarRepository _carRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<ContractServiceImpl> _logger;

        // token lifetime in hours
        private const int TokenLifetimeHours = 24;

        public ContractServiceImpl(
            IContractRepository contractRepository,
            IBookingRepository bookingRepository,
            ICarRepository carRepository,
            IMapper mapper,
            ILogger<ContractServiceImpl> logger)
        {
            _contractRepository = contractRepository;
            _bookingRepository = bookingRepository;
            _carRepository = carRepository;
            _mapper = mapper;
            _logger = logger;
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
            // In backend-only flow we return token so caller (mail service) can use it to email user
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

        public async Task<ResponseDto<List<ContractDto>>> GetContractsByRenterAsync(Guid renterId)
        {
            var contracts = await _contractRepository.GetByRenterIdAsync(renterId);
            return ResponseDto<List<ContractDto>>.Success(contracts.Select(c => _mapper.Map<ContractDto>(c)).ToList());
        }

        public async Task<ResponseDto<ContractDto>> FillContractAsync(Monolithic.DTOs.Contract.FillContractFieldsDto request, Guid callerUserId, string callerRole)
        {
            // Validate booking
            var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
            if (booking == null) return ResponseDto<ContractDto>.Failure("Booking not found");

            // Authorization: if caller is customer, must be owner
            if (callerRole == "Customer")
            {
                if (booking.UserId != callerUserId || request.RenterId != callerUserId)
                    return ResponseDto<ContractDto>.Failure("Forbidden");
            }

            // Business validation
            if (request.EndTime.HasValue && request.EndTime <= request.StartTime)
                return ResponseDto<ContractDto>.Failure("EndTime must be after StartTime");

            var car = await _carRepository.GetByIdAsync(request.CarId);
            if (car == null || !car.IsActive) return ResponseDto<ContractDto>.Failure("Car not found or inactive");

            // Build template map (sanitize simple by trimming)
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

            // Simple template
            var template = "H?P ??NG THUÊ XE\nNg??i thuê: {{FullName}}\nCMND/CCCD: {{IdNumber}}\nB?ng lái: {{DriverLicenseNumber}}\nS?T: {{PhoneNumber}}\nXe: {{Car}}\nTh?i gian: {{StartTime}} - {{EndTime}}\nPhí ??c tính: {{EstimatedAmount}}\nGhi chú: {{AdditionalNotes}}\n";

            foreach (var kv in map)
            {
                template = template.Replace("{{" + kv.Key + "}}", kv.Value);
            }

            var contentHash = ComputeSha256Hash(template);

            // Upsert draft contract
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
    }
}
