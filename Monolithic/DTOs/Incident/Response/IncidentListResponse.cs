namespace Monolithic.DTOs.Incident.Response
{
    public class IncidentListResponse
    {
        public List<IncidentResponse> Incidents { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
