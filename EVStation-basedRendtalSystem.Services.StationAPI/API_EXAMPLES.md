# Station API - Testing Examples

## Base URL
```
https://localhost:7XXX/api/station
```
(Replace 7XXX with your actual port number from launchSettings.json)

---

## 1. Create Station

**Request:**
```http
POST /api/station
Content-Type: application/json

{
  "stationName": "Downtown EV Hub",
  "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 50,
  "availableSlots": 50,
  "status": "Active",
  "description": "Premium EV charging station in the heart of downtown"
}
```

**cURL:**
```bash
curl -X POST "https://localhost:7XXX/api/station" \
  -H "Content-Type: application/json" \
  -d '{
    "stationName": "Downtown EV Hub",
    "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
    "phoneNumber": "+84901234567",
    "totalParkingSlots": 50,
    "availableSlots": 50,
    "status": "Active",
    "description": "Premium EV charging station in the heart of downtown"
  }'
```

---

## 2. Get All Stations

**Request:**
```http
GET /api/station
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station"
```

---

## 3. Get Station by ID

**Request:**
```http
GET /api/station/1
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station/1"
```

---

## 4. Get Stations by Status

**Request:**
```http
GET /api/station/status/Active
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station/status/Active"
```

---

## 5. Update Station

**Request:**
```http
PUT /api/station/1
Content-Type: application/json

{
  "stationName": "Downtown EV Hub - Expanded",
  "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 75,
  "availableSlots": 70,
  "status": "Active",
  "description": "Expanded station with additional charging ports"
}
```

**cURL:**
```bash
curl -X PUT "https://localhost:7XXX/api/station/1" \
  -H "Content-Type: application/json" \
  -d '{
    "stationName": "Downtown EV Hub - Expanded",
    "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
    "phoneNumber": "+84901234567",
    "totalParkingSlots": 75,
    "availableSlots": 70,
    "status": "Active",
    "description": "Expanded station with additional charging ports"
  }'
```

---

## 6. Delete Station (Soft Delete)

**Request:**
```http
DELETE /api/station/1
```

**cURL:**
```bash
curl -X DELETE "https://localhost:7XXX/api/station/1"
```

---

## 7. Get Stations with Available Slots

**Request:**
```http
GET /api/station/available-slots
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station/available-slots"
```

---

## 8. Search Stations

**Request:**
```http
GET /api/station/search/Downtown
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station/search/Downtown"
```

---

## 9. Update Available Slots

**Request:**
```http
PATCH /api/station/1/available-slots/45
```

**cURL:**
```bash
curl -X PATCH "https://localhost:7XXX/api/station/1/available-slots/45"
```

---

## 10. Get Station Statistics

**Request:**
```http
GET /api/station/statistics
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/station/statistics"
```

---

## Sample Test Data

### Create Multiple Stations for Testing

```json
// Station 1 - Ho Chi Minh City
{
  "stationName": "District 1 EV Station",
  "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
  "phoneNumber": "+84901234567",
  "totalParkingSlots": 50,
  "availableSlots": 45,
  "status": "Active",
  "description": "Central station in District 1"
}

// Station 2 - Hanoi
{
  "stationName": "Hoan Kiem EV Hub",
  "address": "456 Tran Hung Dao Street, Hoan Kiem, Hanoi",
  "phoneNumber": "+84902345678",
  "totalParkingSlots": 30,
  "availableSlots": 28,
  "status": "Active",
  "description": "Near Hoan Kiem Lake"
}

// Station 3 - Da Nang
{
  "stationName": "Beach Road Station",
  "address": "789 Vo Nguyen Giap Street, Son Tra, Da Nang",
  "phoneNumber": "+84903456789",
  "totalParkingSlots": 40,
  "availableSlots": 35,
  "status": "Active",
  "description": "Near beach area"
}

// Station 4 - Under Maintenance
{
  "stationName": "Airport Station",
  "address": "Tan Son Nhat Airport, Tan Binh, Ho Chi Minh City",
  "phoneNumber": "+84904567890",
  "totalParkingSlots": 60,
  "availableSlots": 0,
  "status": "Under Maintenance",
  "description": "Airport terminal station"
}

// Station 5 - Highway Station
{
  "stationName": "Highway Rest Stop",
  "address": "National Highway 1A, Km 50, Bien Hoa, Dong Nai",
  "phoneNumber": "+84905678901",
  "totalParkingSlots": 25,
  "availableSlots": 20,
  "status": "Active",
  "description": "Highway rest area"
}
```

---

## Expected Response Formats

### Success Response
```json
{
  "isSuccess": true,
  "message": "Station created successfully",
  "data": {
    "stationId": 1,
    "stationName": "Downtown EV Hub",
    "address": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
    "phoneNumber": "+84901234567",
    "totalParkingSlots": 50,
    "availableSlots": 50,
    "status": "Active",
    "description": "Premium EV charging station",
    "createdAt": "2025-10-09T03:20:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

### Error Response
```json
{
  "isSuccess": false,
  "message": "Station not found",
  "data": null
}
```

### Validation Error Response
```json
{
  "isSuccess": false,
  "message": "Invalid request data",
  "data": {
    "StationName": [
      "Station name is required"
    ],
    "TotalParkingSlots": [
      "Total parking slots must be between 0 and 10000"
    ]
  }
}
```

---

## Testing Workflow Example

### 1. Create Stations
Create 5 stations in different locations with various configurations.

### 2. Get All Stations
Verify all stations are created and returned.

### 3. Search Functionality
- Search by keyword: `GET /api/station/search/Beach`
- Get available slots: `GET /api/station/available-slots`
- Get by status: `GET /api/station/status/Active`

### 4. Slot Management
- Check available slots: `GET /api/station/1`
- Update slots (car rented): `PATCH /api/station/1/available-slots/44`
- Update slots (car returned): `PATCH /api/station/1/available-slots/45`

### 5. Status Management
- Update station to maintenance: Update with `status: "Under Maintenance"`
- Get all maintenance stations: `GET /api/station/status/Under Maintenance`

### 6. Statistics
- Get overall stats: `GET /api/station/statistics`

### 7. Update & Delete
- Update station details: `PUT /api/station/1`
- Soft delete: `DELETE /api/station/1`
- Verify it's not returned: `GET /api/station` (should not include deleted)

---

## Testing with Postman

1. **Import Collection**: Create a new collection named "Station API"
2. **Set Environment Variables**:
   - `baseUrl` = `https://localhost:7XXX`
   - `stationId` = `1` (can be updated after creation)
3. **Create Requests**: Add all endpoints above to the collection
4. **Add Tests**: Add validation scripts to check responses
5. **Run Collection**: Execute all requests in sequence

### Sample Postman Test Script
```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has isSuccess true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.isSuccess).to.eql(true);
});

// Save stationId for subsequent requests
if (pm.response.json().data && pm.response.json().data.stationId) {
    pm.environment.set("stationId", pm.response.json().data.stationId);
}
```

---

## Testing with Swagger

1. Run the application: `dotnet run`
2. Open browser: `https://localhost:7XXX/swagger`
3. Expand each endpoint to see details
4. Click "Try it out" to test endpoints
5. Fill in request body/parameters
6. Click "Execute" to send request
7. Review response

---

## Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 OK | Request successful |
| 400 Bad Request | Invalid request data or business rule violation |
| 404 Not Found | Station not found |
| 500 Internal Server Error | Server error |

---

## Integration Scenarios

### Scenario 1: Booking a Car
```
1. GET /api/station/available-slots - Get stations with available slots
2. Select station with available slots
3. Create booking (in BookingAPI)
4. PATCH /api/station/{id}/available-slots/{newCount} - Decrease available slots
```

### Scenario 2: Returning a Car
```
1. Complete rental (in BookingAPI)
2. Get return station ID
3. PATCH /api/station/{id}/available-slots/{newCount} - Increase available slots
```

### Scenario 3: Finding Stations
```
1. GET /api/station/search/{keyword} - Search by name or address
2. Display matching stations
```

---

## Notes

- All timestamps are in UTC format
- Status values are case-sensitive
- Available slots should never exceed total parking slots
- Delete operations are soft deletes (IsActive = false)
- All GET operations only return active stations
- Search is case-insensitive and searches across name and address fields
