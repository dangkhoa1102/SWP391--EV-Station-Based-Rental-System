# Car API Documentation

## Overview
The Car API is part of the EV Station-based Rental System. It provides comprehensive endpoints to manage electric vehicles, including CRUD operations, search, and filtering capabilities.

## Technology Stack
- .NET 8.0
- Entity Framework Core 8.0
- SQL Server
- Swagger/OpenAPI

## Project Structure

```
CarAPI/
├── Controllers/
│   └── CarController.cs           # API endpoints
├── Data/
│   └── CarDbContext.cs            # Database context
├── DTOs/
│   ├── CreateCarRequestDto.cs     # Create request DTO
│   ├── UpdateCarRequestDto.cs     # Partial update DTO
│   ├── CarResponseDto.cs          # Response DTO
│   └── ApiResponseDto.cs          # Standard API response
├── Models/
│   └── Car.cs                     # Car entity
├── Repository/
│   ├── IRepository/
│   │   └── ICarRepository.cs      # Repository interface
│   └── CarRepository.cs           # Repository implementation
├── Services/
│   ├── IService/
│   │   └── ICarService.cs         # Service interface
│   └── CarService.cs              # Service implementation
├── Migrations/                     # EF Core migrations
└── Program.cs                      # Application entry point
```

## Database Schema

### Cars Table
| Column              | Type           | Description                              |
|---------------------|----------------|------------------------------------------|
| CarId               | INT (PK)       | Primary key, auto-increment              |
| StationId           | INT            | Foreign key to Station (required)        |
| LicensePlate        | NVARCHAR(20)   | License plate (unique, required)         |
| Brand               | NVARCHAR(100)  | Brand name (required)                    |
| Model               | NVARCHAR(100)  | Model name (required)                    |
| Year                | INT            | Manufacturing year (2000-2100)           |
| Color               | NVARCHAR(50)   | Car color (optional)                     |
| SeatCapacity        | INT            | Number of seats (2-20, default: 4)       |
| BatteryCapacity     | DECIMAL(18,2)  | Battery capacity in kWh                  |
| CurrentBatteryLevel | DECIMAL(18,2)  | Current battery level (0-100%)           |
| MaxRange            | INT            | Maximum range in km                      |
| ChargerType         | NVARCHAR(50)   | Charger type (optional)                  |
| HourlyRate          | DECIMAL(18,2)  | Hourly rental rate in VND                |
| DailyRate           | DECIMAL(18,2)  | Daily rental rate in VND                 |
| DepositAmount       | DECIMAL(18,2)  | Security deposit in VND                  |
| Status              | NVARCHAR(50)   | Status (default: Available)              |
| ImageUrl            | NVARCHAR(500)  | URL to car image (optional)              |
| Description         | NVARCHAR(1000) | Detailed description (optional)          |
| CreatedAt           | DATETIME2      | Creation timestamp (UTC)                 |
| UpdatedAt           | DATETIME2      | Last update timestamp (UTC)              |
| IsActive            | BIT            | Soft delete flag                         |

**Indexes:**
- IX_Cars_StationId
- IX_Cars_Status
- IX_Cars_LicensePlate (UNIQUE)
- IX_Cars_Brand

## API Endpoints

### Base URL
```
https://localhost:{port}/api/car
```

### Endpoints Overview

#### 1. Create Car
**POST** `/api/car`

Creates a new car.

**Request Body:**
```json
{
  "stationId": 1,
  "licensePlate": "29A-12345",
  "brand": "VinFast",
  "model": "VF e34",
  "year": 2024,
  "color": "White",
  "seatCapacity": 5,
  "batteryCapacity": 42.0,
  "currentBatteryLevel": 100.0,
  "maxRange": 300,
  "chargerType": "Type 2",
  "hourlyRate": 50000,
  "dailyRate": 500000,
  "depositAmount": 5000000,
  "status": "Available",
  "imageUrl": "https://example.com/car.jpg",
  "description": "Brand new electric SUV"
}
```

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Car created successfully",
  "data": {
    "carId": 1,
    "stationId": 1,
    "licensePlate": "29A-12345",
    ...
    "createdAt": "2025-10-09T02:00:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

---

#### 2. Get Car by ID
**GET** `/api/car/{carId}`

Retrieves a specific car by ID.

---

#### 3. Get All Cars
**GET** `/api/car`

Retrieves all active cars.

---

#### 4. Get Cars by Station
**GET** `/api/car/station/{stationId}`

Retrieves all cars at a specific station.

---

#### 5. Get Cars by Status
**GET** `/api/car/status/{status}`

Retrieves all cars with a specific status.

**Valid Statuses:**
- Available
- Rented
- Maintenance
- Charging
- OutOfService

---

#### 6. Get Available Cars
**GET** `/api/car/available`

Retrieves all available cars.

---

#### 7. Get Cars by Brand
**GET** `/api/car/brand/{brand}`

Retrieves all cars of a specific brand.

**Example:**
```
GET /api/car/brand/VinFast
```

---

#### 8. Get Cars by Price Range
**GET** `/api/car/price-range?minPrice={min}&maxPrice={max}`

Retrieves cars within a price range (based on daily rate).

**Example:**
```
GET /api/car/price-range?minPrice=300000&maxPrice=800000
```

---

#### 9. Search Cars
**GET** `/api/car/search/{searchTerm}`

Searches cars by brand, model, or license plate.

**Example:**
```
GET /api/car/search/VinFast
```

---

#### 10. Update Car (Partial Update)
**PUT** `/api/car/{carId}`

Updates a car. **Only provided fields will be updated** - all fields are optional.

**Request Body (partial example):**
```json
{
  "currentBatteryLevel": 75.0,
  "status": "Charging"
}
```

**Response:** `200 OK`

---

#### 11. Delete Car
**DELETE** `/api/car/{carId}`

Soft deletes a car (sets IsActive to false).

---

#### 12. Update Battery Level
**PATCH** `/api/car/{carId}/battery/{batteryLevel}`

Updates only the battery level for a car.

**Example:**
```
PATCH /api/car/1/battery/85.5
```

---

#### 13. Update Status
**PATCH** `/api/car/{carId}/status/{status}`

Updates only the status for a car.

**Example:**
```
PATCH /api/car/1/status/Rented
```

---

#### 14. Get Car Statistics
**GET** `/api/car/statistics`

Retrieves overall statistics about cars.

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalCars": 50,
    "availableCars": 35,
    "rentedCars": 15
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

1. **Update Connection String**
   
   Edit `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EVR_CarDB;Trusted_Connection=True;TrustServerCertificate=True"
     }
   }
   ```

2. **Restore NuGet Packages**
   ```bash
   dotnet restore
   ```

3. **Apply Migrations**
   ```bash
   dotnet ef database update
   ```

4. **Run the Application**
   ```bash
   dotnet run
   ```

5. **Access Swagger UI**
   
   Navigate to: `https://localhost:{port}/swagger`

---

## Validation Rules

### Required Fields
- StationId
- LicensePlate (max 20 chars, unique)
- Brand (max 100 chars)
- Model (max 100 chars)

### Optional Fields
- Color (max 50 chars)
- ChargerType (max 50 chars)
- ImageUrl (max 500 chars)
- Description (max 1000 chars)

### Numeric Validations
- Year: 2000-2100
- SeatCapacity: 2-20 (default: 4)
- BatteryCapacity: 0-500 kWh
- CurrentBatteryLevel: 0-100%
- MaxRange: 0-1000 km
- HourlyRate: 0-10,000,000 VND
- DailyRate: 0-100,000,000 VND
- DepositAmount: 0-1,000,000 VND

---

## Business Rules

1. **Unique License Plate**: Each car must have a unique license plate
2. **Partial Update**: Update endpoint supports updating any field(s)
3. **Soft Delete**: Cars are never permanently deleted, only marked as inactive
4. **UTC Timestamps**: All timestamps are stored in UTC
5. **Auto Timestamps**: CreatedAt is automatically set on creation, UpdatedAt on modification
6. **Default Values**: 
   - Status defaults to "Available"
   - SeatCapacity defaults to 4
   - CurrentBatteryLevel defaults to 100%
   - IsActive defaults to true

---

## Status Types

- **Available**: Car is ready for rent
- **Rented**: Car is currently being rented
- **Charging**: Car is being charged
- **Maintenance**: Car is under maintenance
- **OutOfService**: Car is not operational

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
  "message": "Car not found",
  "data": null
}
```

---

## Integration Examples

### Get Available Cars at a Station
```
1. GET /api/car/station/{stationId}
2. Filter by status "Available"
```

### Book a Car
```
1. GET /api/car/available - Get available cars
2. Select a car
3. PATCH /api/car/{carId}/status/Rented
4. Create booking (in BookingAPI)
```

### Return a Car
```
1. Complete rental (in BookingAPI)
2. PATCH /api/car/{carId}/status/Available
3. PATCH /api/car/{carId}/battery/{level} - Update battery level
```

---

## License
This project is part of the EV Station-based Rental System.

## Contact
For questions or support, please contact the development team.

