namespace EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request
{
    
        public class SendMailRequest
        {
            public string To { get; set; } = null!;
            public string Subject { get; set; } = null!;
            public string Body { get; set; } = null!;
            public string EmailType { get; set; } = null!; 
        }
    

}
