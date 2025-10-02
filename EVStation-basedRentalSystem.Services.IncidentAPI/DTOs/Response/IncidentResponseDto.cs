using EVStation_basedRentalSystem.Services.IncidentAPI.Entities;

namespace EVStation_basedRentalSystem.Services.Incident.DTOs.Response
{
    public class IncidentResponseDto
    {
        public Guid Id { get; set; }
        public Guid? RentalId { get; set; }
        public Guid? VehicleId { get; set; }
        public Guid ReporterId { get; set; }
        public ReporterRole ReporterRole { get; set; }
        public string Description { get; set; }
        public List<string> Photos { get; set; }
        public Guid? StationId { get; set; }
        public IncidentStatus Status { get; set; }
        public Severity? Severity { get; set; }
        public Guid? AssignedStaffId { get; set; }
        public string Decision { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
