namespace Monolithic.Common
{
    public static class AppRoles
    {
        public const string Admin = "Admin";
        public const string StationStaff = "Station Staff";
        public const string EVRenter = "EV Renter";

        public static readonly string[] AllRoles = { Admin, StationStaff, EVRenter };
    }
}

