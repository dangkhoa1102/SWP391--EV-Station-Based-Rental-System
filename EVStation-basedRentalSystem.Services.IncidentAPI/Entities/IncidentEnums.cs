namespace EVStation_basedRentalSystem.Services.IncidentAPI.Entities
{
    public enum IncidentStatus
    {
        REPORTED,
        VERIFIED,
        ASSIGNED,
        RESOLVED,
        CLOSED,
        INVALID
    }

    public enum Severity
    {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum ReporterRole
    {
        RENTER,
        STAFF
    }
}
