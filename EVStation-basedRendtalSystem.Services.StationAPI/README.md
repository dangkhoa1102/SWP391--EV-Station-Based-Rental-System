# Station API Documentation

## Overview
The Station API is part of the EV Station-based Rental System. It provides comprehensive endpoints to manage EV charging stations, including location management and parking slot tracking.

## Technology Stack
- .NET 8.0
- Entity Framework Core 8.0
- SQL Server
- Swagger/OpenAPI

## Project Structure

```
StationAPI/
├── Controllers/
│   └── StationController.cs           # API endpoints
├── Data/
│   └── StationDbContext.cs            # Database context
├── DTOs/
│   ├── CreateStationRequestDto.cs     # Create request DTO
│   ├── UpdateStationRequestDto.cs     # Update request DTO
│   ├── StationResponseDto.cs          # Response DTO
│   └── ApiResponseDto.cs              # Standard API response
├── Models/
│   └── Station.cs                     # Station entity
├── Repository/
│   ├── IRepository/
│   │   └── IStationRepository.cs      # Repository interface
│   └── StationRepository.cs           # Repository implementation
├── Services/
│   ├── IService/
│   │   └── IStationService.cs         # Service interface
│   └── StationService.cs              # Service implementation
├── Migrations/                         # EF Core migrations
└── Program.cs                          # Application entry point
```

## Database Schema

### Stations Table
| Column            | Type           | Description                                    |
|-------------------|----------------|------------------------------------------------|
| StationId         | INT (PK)       | Primary key, auto-increment                    |
| StationName       | NVARCHAR(200)  | Name of the station (required)                 |
| Address           | NVARCHAR(500)  | Full address (required)                        |
| PhoneNumber       | NVARCHAR(20)   | Contact phone number (optional)                |
| TotalParkingSlots | INT            | Total number of parking slots                  |
| AvailableSlots    | INT            | Currently available slots                      |
| Status            | NVARCHAR(50)   | Status: Active, Inactive, Under Maintenance    |
| Description       | NVARCHAR(1000) | Additional description (optional)              |
| CreatedAt         | DATETIME2      | Creation timestamp (UTC)                       |
| UpdatedAt         | DATETIME2      | Last update timestamp (UTC)                    |
| IsActive          | BIT            | Soft delete flag                               |

**Indexes:**
- IX_Stations_Status
- IX_Stations_StationName

## API Endpoints

### Base URL
```
https://localhost:{port}/api/station
```

### Endpoints Overview

#### 1. Create Station
**POST** `/api/station`

Creates a new station.

**Request Body:**
```json
{
  "stationName": "Downtown EV Station",
  "address": "123 Main Street, District 1, Ho Chi Minh City",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 50,
  "availableSlots": 50,
  "status": "Active",
  "description": "Large EV charging station in downtown area"
}
```

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Station created successfully",
  "data": {
    "stationId": 1,
    "stationName": "Downtown EV Station",
    "address": "123 Main Street, District 1, Ho Chi Minh City",
    "phoneNumber": "+84901234567",
    "totalParkingSlots": 50,
    "availableSlots": 50,
    "status": "Active",
    "description": "Large EV charging station in downtown area",
    "createdAt": "2025-10-09T03:20:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

---

#### 2. Get Station by ID
**GET** `/api/station/{stationId}`

Retrieves a specific station by ID.

**Response:** `200 OK` / `404 Not Found`

---

#### 3. Get All Stations
**GET** `/api/station`

Retrieves all active stations.

**Response:** `200 OK`

---

#### 4. Get Stations by Status
**GET** `/api/station/status/{status}`

Retrieves all stations with a specific status.

**Example:**
```
GET /api/station/status/Active
```

**Valid Statuses:**
- Active
- Inactive
- Under Maintenance

---

#### 5. Update Station
**PUT** `/api/station/{stationId}`

Updates an existing station.

**Request Body:**
```json
{
  "stationName": "Downtown EV Station - Updated",
  "address": "123 Main Street, Updated Building",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 60,
  "availableSlots": 55,
  "status": "Active",
  "description": "Expanded station with more slots"
}
```

**Response:** `200 OK` / `404 Not Found`

---

#### 6. Delete Station
**DELETE** `/api/station/{stationId}`

Soft deletes a station (sets IsActive to false).

**Response:** `200 OK` / `404 Not Found`

---

#### 7. Get Stations with Available Slots
**GET** `/api/station/available-slots`

Retrieves all active stations that have available parking slots.

**Response:** `200 OK`

---

#### 8. Search Stations
**GET** `/api/station/search/{searchTerm}`

Searches stations by name or address.

**Example:**
```
GET /api/station/search/Downtown
```

---

#### 9. Update Available Slots
**PATCH** `/api/station/{stationId}/available-slots/{availableSlots}`

Updates only the available slots for a station.

**Example:**
```
PATCH /api/station/1/available-slots/45
```

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Available slots updated successfully",
  "data": {
    "stationId": 1,
    "availableSlots": 45
  }
}
```

---

#### 10. Get Station Statistics
**GET** `/api/station/statistics`

Retrieves overall statistics about stations.

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalStations": 10,
    "activeStations": 8,
    "inactiveStations": 2
  }
}
```

---

## Setup Instructions

### Prerequisites
- .NET 8.0 SDK
- SQL Server (LocalDB or Express)
- Visual Studio 2022 or VS Code

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EVStation-basedRendtalSystem.Services.StationAPI
   ```

2. **Update Connection String**
   
   Edit `appsettings.json` and update the connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EVRentalStationDB;Trusted_Connection=True;TrustServerCertificate=True"
     }
   }
   ```

3. **Restore NuGet Packages**
   ```bash
   dotnet restore
   ```

4. **Apply Migrations**
   ```bash
   dotnet ef database update
   ```

5. **Run the Application**
   ```bash
   dotnet run
   ```

6. **Access Swagger UI**
   
   Navigate to: `https://localhost:{port}/swagger`

---

## Migration Commands

### Create a new migration
```bash
dotnet ef migrations add MigrationName
```

### Apply migrations to database
```bash
dotnet ef database update
```

### Remove last migration
```bash
dotnet ef migrations remove
```

### Drop database
```bash
dotnet ef database drop
```

---

## Design Patterns Used

### Repository Pattern
Abstracts data access logic and provides a clean separation between business logic and data access layers.

### Service Layer Pattern
Contains business logic and orchestrates operations between controllers and repositories.

### Dependency Injection
All services and repositories are registered in `Program.cs` and injected via constructor injection.

---

## Validation Rules

### Required Fields
- StationName (max 200 chars)
- Address (max 500 chars)

### Optional Fields
- PhoneNumber (max 20 chars, must be valid format)
- Description (max 1000 chars)

### Numeric Validations
- TotalParkingSlots: 0-10000
- AvailableSlots: 0-10000 (cannot exceed TotalParkingSlots)

---

## Business Rules

1. **Unique Station Names**: Each station must have a unique name.
2. **Available Slots Validation**: Available slots cannot exceed total parking slots.
3. **Soft Delete**: Stations are never permanently deleted, only marked as inactive.
4. **UTC Timestamps**: All timestamps are stored in UTC.
5. **Auto Timestamps**: CreatedAt is automatically set on creation, UpdatedAt on modification.
6. **Default Status**: New stations default to "Active" status.

---

## Status Types

- **Active**: Station is operational and accepting rentals
- **Inactive**: Station is temporarily closed
- **Under Maintenance**: Station is undergoing maintenance

---

## Error Handling

All endpoints return a standard `ApiResponseDto` with:
- `isSuccess`: Boolean indicating success/failure
- `message`: Description of the result
- `data`: Response data (null on error)

Example error response:
```json
{
  "isSuccess": false,
  "message": "Station not found",
  "data": null
}
```

---

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns (Status, StationName)
2. **Async Operations**: All database operations are asynchronous
3. **Soft Delete**: Improves performance by avoiding actual deletions
4. **LINQ Optimization**: Efficient query generation with Entity Framework

---

## Integration Examples

### Checking Available Slots Before Booking
```csharp
// Get station with available slots
var station = await GetStationById(stationId);
if (station.AvailableSlots > 0)
{
    // Proceed with booking
    // After booking, update available slots
    await UpdateAvailableSlots(stationId, station.AvailableSlots - 1);
}
```

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement pagination for list endpoints
- [ ] Add filtering and sorting options
- [ ] Real-time slot availability using SignalR
- [ ] Implement station ratings and reviews
- [ ] Add charging port types and availability
- [ ] Implement pricing information per station
- [ ] Add station images/photos
- [ ] Add operating hours management

---

## Testing Tips

### Sample Test Data
```json
{
  "stationName": "Test Station 1",
  "address": "123 Test Street, District 1, Hanoi",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 20,
  "availableSlots": 20,
  "status": "Active",
  "description": "Test station for development"
}
```

### Common Test Scenarios
1. Create multiple stations in different locations
2. Update available slots as cars are rented/returned
3. Search for stations by keyword
4. Find stations with available slots
5. Change station status to "Under Maintenance"

---

## License
This project is part of the EV Station-based Rental System.

## Contact
For questions or support, please contact the development team.
