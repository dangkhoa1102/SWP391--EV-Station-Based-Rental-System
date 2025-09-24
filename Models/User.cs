using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
    internal class User : IdentityUser
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public enum ROLE
        {            
            RENTER,
            STAFF
        }
        public enum STATUS
        {
            ACTIVE,
            INACTIVE,
            SUSPENDED
        }
    }
}
