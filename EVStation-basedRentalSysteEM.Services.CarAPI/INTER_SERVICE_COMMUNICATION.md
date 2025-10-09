# Inter-Service Communication - CarAPI ↔ StationAPI

## 📡 Overview

CarAPI và StationAPI đã được kết nối với nhau thông qua **HTTP Client Communication** - một pattern chuẩn trong kiến trúc Microservices.

## 🔗 Architecture

```
┌─────────────┐         HTTP Request          ┌──────────────┐
│             │ ──────────────────────────────> │              │
│   CarAPI    │                                 │  StationAPI  │
│  (Port TBD) │ <────────────────────────────── │  (Port 7001) │
│             │         HTTP Response           │              │
└─────────────┘                                 └──────────────┘
      │                                                │
      │                                                │
      ▼                                                ▼
┌─────────────┐                                 ┌──────────────┐
│  EVR_CarDB  │                                 │EVRentalStationDB│
└─────────────┘                                 └──────────────┘
```

## ✨ Features Implemented

### 1. **Station Validation on Car Creation**
Khi tạo car mới, CarAPI sẽ validate rằng StationId tồn tại và active trong StationAPI.

**Flow:**
```
1. Client → POST /api/car (với StationId)
2. CarAPI → Gọi StationAPI: GET /api/station/{stationId}
3. StationAPI → Trả về station info
4. CarAPI → Validate station exists & active
5. CarAPI → Create car nếu valid
6. CarAPI → Return response to client
```

### 2. **Station Validation on Car Update**
Khi update StationId của car, CarAPI validate station mới.

### 3. **Get Car with Station Details**
Endpoint mới cho phép lấy thông tin car kèm theo station details.

**Endpoint:** `GET /api/car/{carId}/with-station`

**Response:**
```json
{
  "isSuccess": true,
  "message": "Car with station details retrieved successfully",
  "data": {
    "carId": 1,
    "stationId": 1,
    "licensePlate": "29A-12345",
    "brand": "VinFast",
    "model": "VF e34",
    ...
    "station": {
      "stationName": "Downtown EV Hub",
      "address": "123 Nguyen Hue Street",
      "phoneNumber": "+84901234567",
      "availableSlots": 45,
      "status": "Active"
    }
  }
}
```

## 🛠️ Implementation Details

### 1. **HTTP Client Setup**

**File:** `Clients/StationClient.cs`

```csharp
public class StationClient : IStationClient
{
    private readonly HttpClient _httpClient;
    
    // Methods:
    - StationExistsAsync(int stationId)
    - GetStationByIdAsync(int stationId)
    - HasAvailableSlotsAsync(int stationId)
}
```

### 2. **Configuration**

**File:** `appsettings.json`

```json
{
  "ServiceUrls": {
    "StationAPI": "https://localhost:7001"
  }
}
```

**File:** `Program.cs`

```csharp
builder.Services.AddHttpClient<IStationClient, StationClient>(client =>
{
    var stationApiUrl = builder.Configuration["ServiceUrls:StationAPI"];
    client.BaseAddress = new Uri(stationApiUrl ?? "https://localhost:7001");
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

### 3. **Service Integration**

**File:** `Services/CarService.cs`

```csharp
public class CarService : ICarService
{
    private readonly ICarRepository _carRepository;
    private readonly IStationClient _stationClient;  // ← Injected
    
    // Validation trong CreateCarAsync:
    var stationExists = await _stationClient.StationExistsAsync(request.StationId);
    if (!stationExists)
    {
        return new ApiResponseDto
        {
            IsSuccess = false,
            Message = $"Station with ID {request.StationId} does not exist or is not active."
        };
    }
}
```

## 📋 API Endpoints

### CarAPI Endpoints

| Method | Endpoint | Description | Station Communication |
|--------|----------|-------------|----------------------|
| POST | `/api/car` | Create car | ✅ Validates StationId |
| PUT | `/api/car/{id}` | Update car | ✅ Validates StationId if updated |
| GET | `/api/car/{id}/with-station` | Get car with station | ✅ Fetches station details |

### StationAPI Endpoints Used

| Method | Endpoint | Used By CarAPI |
|--------|----------|----------------|
| GET | `/api/station/{id}` | ✅ Validation & Details |

## 🔄 Communication Patterns

### Pattern 1: Synchronous Validation

```
Client Request → CarAPI → StationAPI → Validate → Response
```

**Pros:**
- ✅ Real-time validation
- ✅ Data consistency
- ✅ Simple to implement

**Cons:**
- ❌ Dependency on StationAPI availability
- ❌ Increased latency

### Pattern 2: Enriched Response

```
Client Request → CarAPI → Get Car → StationAPI → Get Station → Merged Response
```

**Pros:**
- ✅ Complete data in one call
- ✅ Better UX

**Cons:**
- ❌ Slower response time
- ❌ More complex

## ⚙️ Configuration

### Development Environment

```json
// CarAPI appsettings.json
{
  "ServiceUrls": {
    "StationAPI": "https://localhost:7001"
  }
}
```

### Production Environment

```json
// CarAPI appsettings.Production.json
{
  "ServiceUrls": {
    "StationAPI": "https://stationapi.production.com"
  }
}
```

## 🚀 How to Run Both APIs

### Option 1: Run Separately

**Terminal 1 - StationAPI:**
```bash
cd EVStation-basedRendtalSystem.Services.StationAPI
dotnet run
# Running on https://localhost:7001
```

**Terminal 2 - CarAPI:**
```bash
cd EVStation-basedRentalSysteEM.Services.CarAPI
dotnet run
# Running on https://localhost:7XXX
```

### Option 2: Use Solution

```bash
# Run from solution root
dotnet run --project EVStation-basedRendtalSystem.Services.StationAPI
dotnet run --project EVStation-basedRentalSysteEM.Services.CarAPI
```

## 📝 Testing Inter-Service Communication

### Test 1: Create Car with Valid Station

**Step 1:** Create a station in StationAPI
```bash
POST https://localhost:7001/api/station
{
  "stationName": "Test Station",
  "address": "123 Test St",
  "totalParkingSlots": 50,
  "availableSlots": 50,
  "status": "Active"
}
# Response: stationId = 1
```

**Step 2:** Create a car with that StationId
```bash
POST https://localhost:7XXX/api/car
{
  "stationId": 1,  // ← Valid station
  "licensePlate": "29A-12345",
  "brand": "VinFast",
  ...
}
# Response: Success ✅
```

### Test 2: Create Car with Invalid Station

```bash
POST https://localhost:7XXX/api/car
{
  "stationId": 999,  // ← Invalid station
  "licensePlate": "29A-12345",
  ...
}
# Response: 
{
  "isSuccess": false,
  "message": "Station with ID 999 does not exist or is not active."
}
```

### Test 3: Get Car with Station Details

```bash
GET https://localhost:7XXX/api/car/1/with-station

# Response:
{
  "isSuccess": true,
  "data": {
    "carId": 1,
    "stationId": 1,
    "licensePlate": "29A-12345",
    ...
    "station": {
      "stationName": "Test Station",
      "address": "123 Test St",
      ...
    }
  }
}
```

## 🔧 Error Handling

### Scenario 1: StationAPI is Down

```csharp
// StationClient handles this gracefully
try
{
    var response = await _httpClient.GetAsync($"/api/station/{stationId}");
    ...
}
catch (Exception ex)
{
    _logger.LogError(ex, $"Error checking station existence");
    return false;  // Fail safely
}
```

**Result:** Car creation will fail with appropriate error message.

### Scenario 2: Station Not Found

```json
{
  "isSuccess": false,
  "message": "Station with ID 5 does not exist or is not active."
}
```

### Scenario 3: Network Timeout

```csharp
// Configured in Program.cs
client.Timeout = TimeSpan.FromSeconds(30);
```

## 📊 Benefits

### 1. **Data Integrity**
- ✅ Không thể tạo car với StationId không tồn tại
- ✅ Luôn có reference đúng giữa Car và Station

### 2. **Decoupling**
- ✅ Mỗi API có database riêng
- ✅ Có thể scale độc lập
- ✅ Có thể deploy riêng

### 3. **Flexibility**
- ✅ Dễ thêm validation rules
- ✅ Dễ thêm endpoints mới
- ✅ Dễ maintain

## 🔮 Future Enhancements

### 1. **Caching**
```csharp
// Cache station data để giảm calls
services.AddMemoryCache();
```

### 2. **Circuit Breaker Pattern**
```csharp
// Polly library
services.AddHttpClient<IStationClient, StationClient>()
    .AddTransientHttpErrorPolicy(p => 
        p.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
```

### 3. **Retry Policy**
```csharp
services.AddHttpClient<IStationClient, StationClient>()
    .AddTransientHttpErrorPolicy(p => 
        p.WaitAndRetryAsync(3, retryAttempt => 
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))));
```

### 4. **Message Queue (RabbitMQ/Kafka)**
```
CarAPI → Publish Event → Queue → StationAPI Subscribe
```

### 5. **API Gateway**
```
Client → API Gateway → Route to CarAPI/StationAPI
```

## 📚 Related Documentation

- `README.md` - CarAPI documentation
- `API_EXAMPLES.md` - API testing examples
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## 🎯 Summary

✅ **Implemented:**
- HTTP Client communication
- Station validation on car create/update
- Get car with station details endpoint
- Error handling
- Logging

✅ **Benefits:**
- Data integrity
- Microservices architecture
- Independent scaling
- Clear separation of concerns

✅ **Ready for:**
- Production use
- Further enhancements
- Integration with more services

---

**Status: ✅ COMPLETE & WORKING**

Cả 2 APIs đã có thể giao tiếp với nhau một cách hiệu quả! 🎉

