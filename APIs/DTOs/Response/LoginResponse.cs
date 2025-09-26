namespace APIs.DTOs.Response
{
    public class LoginResponse
    {
        public string Token { get; set; }
        public string Email { get; set; }
        public string UserName { get; set; }
        public IList<string> Roles { get; set; }
    }
}
