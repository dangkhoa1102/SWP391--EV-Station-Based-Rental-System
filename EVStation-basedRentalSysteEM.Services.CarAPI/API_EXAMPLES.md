# Car API - Testing Examples

## Base URL
```
https://localhost:7XXX/api/car
```
(Replace 7XXX with your actual port number from launchSettings.json)

---

## 1. Create Car

**Request:**
```http
POST /api/car
Content-Type: application/json

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
  "imageUrl": "https://example.com/vinfast-vfe34.jpg",
  "description": "Brand new electric SUV with 5 seats"
}
```

**cURL:**
```bash
curl -X POST "https://localhost:7XXX/api/car" \
  -H "Content-Type: application/json" \
  -d '{
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
    "imageUrl": "https://example.com/vinfast-vfe34.jpg",
    "description": "Brand new electric SUV with 5 seats"
  }'
```

---

## 2. Get All Cars

**Request:**
```http
GET /api/car
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car"
```

---

## 3. Get Car by ID

**Request:**
```http
GET /api/car/1
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/1"
```

---

## 4. Get Cars by Station

**Request:**
```http
GET /api/car/station/1
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/station/1"
```

---

## 5. Get Cars by Status

**Request:**
```http
GET /api/car/status/Available
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/status/Available"
```

---

## 6. Get Available Cars

**Request:**
```http
GET /api/car/available
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/available"
```

---

## 7. Get Cars by Brand

**Request:**
```http
GET /api/car/brand/VinFast
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/brand/VinFast"
```

---

## 8. Get Cars by Price Range

**Request:**
```http
GET /api/car/price-range?minPrice=300000&maxPrice=800000
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/price-range?minPrice=300000&maxPrice=800000"
```

---

## 9. Search Cars

**Request:**
```http
GET /api/car/search/VinFast
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/search/VinFast"
```

---

## 10. Update Car (Full Update)

**Request:**
```http
PUT /api/car/1
Content-Type: application/json

{
  "stationId": 1,
  "licensePlate": "29A-12345",
  "brand": "VinFast",
  "model": "VF e34",
  "year": 2024,
  "color": "Blue",
  "seatCapacity": 5,
  "batteryCapacity": 42.0,
  "currentBatteryLevel": 85.0,
  "maxRange": 300,
  "chargerType": "Type 2",
  "hourlyRate": 55000,
  "dailyRate": 550000,
  "depositAmount": 5000000,
  "status": "Available",
  "imageUrl": "https://example.com/vinfast-vfe34-blue.jpg",
  "description": "Electric SUV - Color updated to blue"
}
```

---

## 11. Update Car (Partial Update - Only Battery Level)

**Request:**
```http
PUT /api/car/1
Content-Type: application/json

{
  "currentBatteryLevel": 75.0
}
```

**cURL:**
```bash
curl -X PUT "https://localhost:7XXX/api/car/1" \
  -H "Content-Type: application/json" \
  -d '{"currentBatteryLevel": 75.0}'
```

---

## 12. Update Car (Partial Update - Status and Price)

**Request:**
```http
PUT /api/car/1
Content-Type: application/json

{
  "status": "Maintenance",
  "dailyRate": 600000
}
```

---

## 13. Delete Car (Soft Delete)

**Request:**
```http
DELETE /api/car/1
```

**cURL:**
```bash
curl -X DELETE "https://localhost:7XXX/api/car/1"
```

---

## 14. Update Battery Level

**Request:**
```http
PATCH /api/car/1/battery/90.5
```

**cURL:**
```bash
curl -X PATCH "https://localhost:7XXX/api/car/1/battery/90.5"
```

---

## 15. Update Status

**Request:**
```http
PATCH /api/car/1/status/Rented
```

**cURL:**
```bash
curl -X PATCH "https://localhost:7XXX/api/car/1/status/Rented"
```

---

## 16. Get Car Statistics

**Request:**
```http
GET /api/car/statistics
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/car/statistics"
```

---

## Sample Test Data

### Create Multiple Cars for Testing

```json
// Car 1 - VinFast VF e34
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
  "description": "Compact electric SUV"
}

// Car 2 - Tesla Model 3
{
  "stationId": 1,
  "licensePlate": "30B-67890",
  "brand": "Tesla",
  "model": "Model 3",
  "year": 2023,
  "color": "Black",
  "seatCapacity": 5,
  "batteryCapacity": 60.0,
  "currentBatteryLevel": 95.0,
  "maxRange": 450,
  "chargerType": "Type 2",
  "hourlyRate": 80000,
  "dailyRate": 800000,
  "depositAmount": 10000000,
  "status": "Available",
  "description": "Premium electric sedan"
}

// Car 3 - VinFast VF 8
{
  "stationId": 2,
  "licensePlate": "51C-11111",
  "brand": "VinFast",
  "model": "VF 8",
  "year": 2024,
  "color": "Red",
  "seatCapacity": 7,
  "batteryCapacity": 87.7,
  "currentBatteryLevel": 100.0,
  "maxRange": 420,
  "chargerType": "Type 2",
  "hourlyRate": 70000,
  "dailyRate": 700000,
  "depositAmount": 8000000,
  "status": "Available",
  "description": "7-seater electric SUV"
}

// Car 4 - BYD Atto 3
{
  "stationId": 2,
  "licensePlate": "92D-22222",
  "brand": "BYD",
  "model": "Atto 3",
  "year": 2024,
  "color": "Blue",
  "seatCapacity": 5,
  "batteryCapacity": 60.5,
  "currentBatteryLevel": 80.0,
  "maxRange": 420,
  "chargerType": "Type 2",
  "hourlyRate": 60000,
  "dailyRate": 600000,
  "depositAmount": 6000000,
  "status": "Charging",
  "description": "Popular electric crossover"
}

// Car 5 - Hyundai Ioniq 5
{
  "stationId": 3,
  "licensePlate": "79E-33333",
  "brand": "Hyundai",
  "model": "Ioniq 5",
  "year": 2023,
  "color": "Silver",
  "seatCapacity": 5,
  "batteryCapacity": 77.4,
  "currentBatteryLevel": 100.0,
  "maxRange": 481,
  "chargerType": "CCS",
  "hourlyRate": 75000,
  "dailyRate": 750000,
  "depositAmount": 9000000,
  "status": "Available",
  "description": "Futuristic electric crossover"
}
```

---

## Expected Response Formats

### Success Response
```json
{
  "isSuccess": true,
  "message": "Car created successfully",
  "data": {
    "carId": 1,
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
    "hourlyRate": 50000.0,
    "dailyRate": 500000.0,
    "depositAmount": 5000000.0,
    "status": "Available",
    "imageUrl": "https://example.com/vinfast-vfe34.jpg",
    "description": "Brand new electric SUV with 5 seats",
    "createdAt": "2025-10-09T02:00:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

### Error Response
```json
{
  "isSuccess": false,
  "message": "Car not found",
  "data": null
}
```

### Validation Error Response
```json
{
  "isSuccess": false,
  "message": "Invalid request data",
  "data": {
    "LicensePlate": [
      "License plate is required"
    ],
    "Brand": [
      "Brand is required"
    ]
  }
}
```

---

## Testing Workflow Example

### 1. Create Cars
Create 5 different cars with various brands and specifications.

### 2. Get All Cars
Verify all cars are created and returned.

### 3. Search & Filter
- Search by brand: `GET /api/car/brand/VinFast`
- Search by keyword: `GET /api/car/search/Tesla`
- Get available cars: `GET /api/car/available`
- Filter by price: `GET /api/car/price-range?minPrice=400000&maxPrice=700000`

### 4. Update Operations
- Full update: Update all fields
- Partial update (battery): `PUT /api/car/1` with `{"currentBatteryLevel": 75.0}`
- Partial update (status): `PUT /api/car/1` with `{"status": "Rented"}`
- Quick battery update: `PATCH /api/car/1/battery/85.0`
- Quick status update: `PATCH /api/car/1/status/Available`

### 5. Statistics
Get overall stats: `GET /api/car/statistics`

### 6. Delete
Soft delete: `DELETE /api/car/1`
Verify it's not returned: `GET /api/car` (should not include deleted)

---

## Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 OK | Request successful |
| 400 Bad Request | Invalid request data or business rule violation |
| 404 Not Found | Car not found |
| 500 Internal Server Error | Server error |

---

## Notes

- All timestamps are in UTC format
- Battery level is in percentage (0-100%)
- Prices are in VND (Vietnamese Dong)
- License plates must be unique
- Delete operations are soft deletes (IsActive = false)
- All GET operations only return active cars
- Search is case-insensitive
- Partial updates support - only provided fields are updated

