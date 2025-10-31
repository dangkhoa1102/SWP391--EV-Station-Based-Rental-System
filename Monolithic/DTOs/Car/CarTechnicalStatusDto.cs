using System.ComponentModel.DataAnnotations;

namespace Monolithic.DTOs.Car
{
    /// <summary>
    /// DTO ?? c?p nh?t tình tr?ng k? thu?t c?a xe
    /// </summary>
    public class UpdateCarTechnicalStatusDto
    {
        [Required]
        public Guid CarId { get; set; }

        /// <summary>
        /// Tình tr?ng ??ng c? (Good, Fair, Poor, NeedRepair)
        /// </summary>
        [StringLength(50)]
        public string? EngineStatus { get; set; }

        /// <summary>
        /// Tình tr?ng l?p xe
        /// </summary>
        [StringLength(50)]
        public string? TireStatus { get; set; }

        /// <summary>
        /// Tình tr?ng h? th?ng phanh
        /// </summary>
        [StringLength(50)]
        public string? BrakeStatus { get; set; }

        /// <summary>
        /// Tình tr?ng ?èn chi?u sáng
        /// </summary>
        [StringLength(50)]
        public string? LightStatus { get; set; }

        /// <summary>
        /// Tình tr?ng n?i th?t
        /// </summary>
        [StringLength(50)]
        public string? InteriorStatus { get; set; }

        /// <summary>
        /// Tình tr?ng ngo?i th?t
        /// </summary>
        [StringLength(50)]
        public string? ExteriorStatus { get; set; }

        /// <summary>
        /// Ghi chú k? thu?t
        /// </summary>
        [StringLength(1000)]
        public string? TechnicalNotes { get; set; }

        /// <summary>
        /// Ngày ki?m tra cu?i cùng
        /// </summary>
        public DateTime LastInspectionDate { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// DTO cho vi?c bàn giao xe v?i hình ?nh
    /// </summary>
    public class CarHandoverDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public Guid CarId { get; set; }

        /// <summary>
        /// Lo?i bàn giao: CheckIn ho?c CheckOut
        /// </summary>
        [Required]
        public HandoverType HandoverType { get; set; }

        /// <summary>
        /// ?nh xe tr??c khi bàn giao (nhi?u ?nh)
        /// </summary>
        public List<IFormFile>? HandoverPhotos { get; set; }

        /// <summary>
        /// Ghi chú v? tình tr?ng xe
        /// </summary>
        [StringLength(1000)]
        public string? Notes { get; set; }

        /// <summary>
        /// M?c pin hi?n t?i
        /// </summary>
        [Range(0, 100)]
        public decimal CurrentBatteryLevel { get; set; }

        /// <summary>
        /// S? km ?ã ch?y (cho check-out)
        /// </summary>
        public decimal? MileageReading { get; set; }
    }

    public enum HandoverType
    {
        CheckIn,   // Giao xe cho khách
        CheckOut   // Nh?n xe t? khách
    }

    /// <summary>
    /// Response sau khi bàn giao xe
    /// </summary>
    public class CarHandoverResponseDto
    {
        public Guid BookingId { get; set; }
        public Guid CarId { get; set; }
        public HandoverType HandoverType { get; set; }
        public List<string> PhotoUrls { get; set; } = new();
        public string Notes { get; set; } = string.Empty;
        public decimal BatteryLevel { get; set; }
        public decimal? Mileage { get; set; }
        public DateTime HandoverDateTime { get; set; }
        public string StaffId { get; set; } = string.Empty;
    }
}
