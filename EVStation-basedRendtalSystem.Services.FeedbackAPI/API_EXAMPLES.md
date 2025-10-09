# Feedback API - Testing Examples

## Base URL
```
https://localhost:7XXX/api/feedback
```
(Replace 7XXX with your actual port number from launchSettings.json)

---

## 1. Create Feedback

**Request:**
```http
POST /api/feedback
Content-Type: application/json

{
  "userId": "user-001",
  "bookingId": 1,
  "carId": 5,
  "rating": 5,
  "comment": "Excellent car! Very clean and comfortable ride."
}
```

**cURL:**
```bash
curl -X POST "https://localhost:7XXX/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "bookingId": 1,
    "carId": 5,
    "rating": 5,
    "comment": "Excellent car! Very clean and comfortable ride."
  }'
```

---

## 2. Get All Feedbacks

**Request:**
```http
GET /api/feedback
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback"
```

---

## 3. Get Feedback by ID

**Request:**
```http
GET /api/feedback/1
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/1"
```

---

## 4. Get Feedbacks by User ID

**Request:**
```http
GET /api/feedback/user/user-001
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/user/user-001"
```

---

## 5. Get Feedbacks by Car ID

**Request:**
```http
GET /api/feedback/car/5
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/car/5"
```

---

## 6. Get Feedback by Booking ID

**Request:**
```http
GET /api/feedback/booking/1
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/booking/1"
```

---

## 7. Update Feedback

**Request:**
```http
PUT /api/feedback/1
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated: Good car but a bit noisy."
}
```

**cURL:**
```bash
curl -X PUT "https://localhost:7XXX/api/feedback/1" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Updated: Good car but a bit noisy."
  }'
```

---

## 8. Delete Feedback (Soft Delete)

**Request:**
```http
DELETE /api/feedback/1
```

**cURL:**
```bash
curl -X DELETE "https://localhost:7XXX/api/feedback/1"
```

---

## 9. Get Car Average Rating

**Request:**
```http
GET /api/feedback/car/5/average-rating
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/car/5/average-rating"
```

---

## 10. Get Car Feedback Statistics

**Request:**
```http
GET /api/feedback/car/5/stats
```

**cURL:**
```bash
curl -X GET "https://localhost:7XXX/api/feedback/car/5/stats"
```

---

## Sample Test Data

### Create Multiple Feedbacks for Testing

```json
// Feedback 1
{
  "userId": "user-001",
  "bookingId": 1,
  "carId": 5,
  "rating": 5,
  "comment": "Excellent car! Very clean and comfortable ride."
}

// Feedback 2
{
  "userId": "user-002",
  "bookingId": 2,
  "carId": 5,
  "rating": 4,
  "comment": "Good car, but could be cleaner."
}

// Feedback 3
{
  "userId": "user-003",
  "bookingId": 3,
  "carId": 5,
  "rating": 5,
  "comment": "Amazing experience! Will rent again."
}

// Feedback 4
{
  "userId": "user-001",
  "bookingId": 4,
  "carId": 10,
  "rating": 3,
  "comment": "Average car, nothing special."
}
```

---

## Expected Response Formats

### Success Response
```json
{
  "isSuccess": true,
  "message": "Feedback created successfully",
  "data": {
    "feedbackId": 1,
    "userId": "user-001",
    "bookingId": 1,
    "carId": 5,
    "rating": 5,
    "comment": "Excellent car!",
    "createdAt": "2025-10-06T01:30:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

### Error Response
```json
{
  "isSuccess": false,
  "message": "Feedback not found",
  "data": null
}
```

### Validation Error Response
```json
{
  "isSuccess": false,
  "message": "Invalid request data",
  "data": {
    "Rating": [
      "Rating must be between 1 and 5"
    ]
  }
}
```

---

## Testing with Postman

1. **Import Collection**: Create a new collection named "Feedback API"
2. **Set Base URL**: Create an environment variable `baseUrl` = `https://localhost:7XXX`
3. **Create Requests**: Add all endpoints above to the collection
4. **Run Tests**: Execute requests in order

---

## Testing with Swagger

1. Run the application: `dotnet run`
2. Open browser: `https://localhost:7XXX/swagger`
3. Expand each endpoint to see details
4. Click "Try it out" to test endpoints
5. Fill in request body/parameters
6. Click "Execute" to send request

---

## Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 OK | Request successful |
| 400 Bad Request | Invalid request data |
| 404 Not Found | Resource not found |
| 500 Internal Server Error | Server error |

---

## Notes

- All timestamps are in UTC format
- Rating must be between 1 and 5
- Comment is optional with max 1000 characters
- One feedback per booking per user
- Delete operations are soft deletes (IsActive = false)
- All GET operations only return active feedbacks

