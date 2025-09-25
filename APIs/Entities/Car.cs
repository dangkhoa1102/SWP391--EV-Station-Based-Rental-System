namespace APIs.Entities
{
    public class Car
    {
        public int id { get; set; }
        public string station_id { get; set; }
        public string license_plate { get; set; }
        public int seat { get; set; }
        public string model { get; set; }
        public string brand { get; set; }
        public string color { get; set; }
        public int year { get; set; }
        public double battery_capacity { get; set; }
        public double current_battery_level { get; set; }
        public double hourly_rate { get; set; }
        public double daily_rate { get; set; }
        public double last_maintenance_day { get; set; }
        public string state { get; set; }
        public bool status { get; set; }
    }
}
