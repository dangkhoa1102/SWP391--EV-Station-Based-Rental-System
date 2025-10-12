# Feedback API Documentation

## Overview
The Feedback API is part of the EV Station-based Rental System. It provides endpoints to manage customer feedback and ratings for car rentals.

## Technology Stack
- .NET 8.0
- Entity Framework Core 8.0
- SQL Server
- Swagger/OpenAPI

## Project Structure

```
FeedbackAPI/
├── Controllers/
│   └── FeedbackController.cs          # API endpoints
├── Data/
│   └── FeedbackDbContext.cs           # Database context
├── DTOs/
│   ├── CreateFeedbackRequestDto.cs    # Create request DTO
│   ├── UpdateFeedbackRequestDto.cs    # Update request DTO
│   ├── FeedbackResponseDto.cs         # Response DTO
│   └── ApiResponseDto.cs              # Standard API response
├── Models/
│   └── Feedback.cs                    # Feedback entity
├── Repository/
│   ├── IRepository/
│   │   └── IFeedbackRepository.cs     # Repository interface
│   └── FeedbackRepository.cs          # Repository implementation
├── Services/
│   ├── IService/
│   │   └── IFeedbackService.cs        # Service interface
│   └── FeedbackService.cs             # Service implementation
├── Migrations/                         # EF Core migrations
└── Program.cs                          # Application entry point
```

## Database Schema

### Feedbacks Table
| Column      | Type           | Description                           |
|-------------|----------------|---------------------------------------|
| FeedbackId  | INT (PK)       | Primary key, auto-increment           |
| UserId      | NVARCHAR(450)  | User who created the feedback         |
| BookingId   | INT            | Associated booking ID                 |
| CarId       | INT            | Car that was rated                    |
| Rating      | INT            | Rating (1-5)                          |
| Comment     | NVARCHAR(1000) | Optional comment                      |
| CreatedAt   | DATETIME2      | Creation timestamp (UTC)              |
| UpdatedAt   | DATETIME2      | Last update timestamp (UTC)           |
| IsActive    | BIT            | Soft delete flag                      |

**Indexes:**
- IX_Feedbacks_UserId
- IX_Feedbacks_CarId
- IX_Feedbacks_BookingId

## API Endpoints

### Base URL
```
https://localhost:{port}/api/feedback
```

### Endpoints

#### 1. Create Feedback
**POST** `/api/feedback`

Creates a new feedback entry.

**Request Body:**
```json
{
  "userId": "user123",
  "bookingId": 1,
  "carId": 5,
  "rating": 5,
  "comment": "Great car! Very clean and comfortable."
}
```

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Feedback created successfully",
  "data": {
    "feedbackId": 1,
    "userId": "user123",
    "bookingId": 1,
    "carId": 5,
    "rating": 5,
    "comment": "Great car! Very clean and comfortable.",
    "createdAt": "2025-10-06T01:30:00Z",
    "updatedAt": null,
    "isActive": true
  }
}
```

---

#### 2. Get Feedback by ID
**GET** `/api/feedback/{feedbackId}`

Retrieves a specific feedback by ID.

**Response:** `200 OK` / `404 Not Found`

---

#### 3. Get All Feedbacks
**GET** `/api/feedback`

Retrieves all active feedbacks.

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Feedbacks retrieved successfully",
  "data": [
    {
      "feedbackId": 1,
      "userId": "user123",
      "bookingId": 1,
      "carId": 5,
      "rating": 5,
      "comment": "Great car!",
      "createdAt": "2025-10-06T01:30:00Z",
      "updatedAt": null,
      "isActive": true
    }
  ]
}
```

---

#### 4. Get Feedbacks by User ID
**GET** `/api/feedback/user/{userId}`

Retrieves all feedbacks created by a specific user.

---

#### 5. Get Feedbacks by Car ID
**GET** `/api/feedback/car/{carId}`

Retrieves all feedbacks for a specific car.

---

#### 6. Get Feedback by Booking ID
**GET** `/api/feedback/booking/{bookingId}`

Retrieves feedback for a specific booking.

**Response:** `200 OK` / `404 Not Found`

---

#### 7. Update Feedback
**PUT** `/api/feedback/{feedbackId}`

Updates an existing feedback.

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

**Response:** `200 OK` / `404 Not Found`

---

#### 8. Delete Feedback
**DELETE** `/api/feedback/{feedbackId}`

Soft deletes a feedback (sets IsActive to false).

**Response:** `200 OK` / `404 Not Found`

---

#### 9. Get Car Average Rating
**GET** `/api/feedback/car/{carId}/average-rating`

Retrieves the average rating for a specific car.

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Average rating retrieved successfully",
  "data": {
    "carId": 5,
    "averageRating": 4.5
  }
}
```

---

#### 10. Get Car Feedback Statistics
**GET** `/api/feedback/car/{carId}/stats`

Retrieves comprehensive statistics for a car's feedbacks.

**Response:** `200 OK`
```json
{
  "isSuccess": true,
  "message": "Feedback statistics retrieved successfully",
  "data": {
    "carId": 5,
    "averageRating": 4.5,
    "totalFeedbacks": 10
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
   cd EVStation-basedRendtalSystem.Services.FeedbackAPI
   ```

2. **Update Connection String**
   
   Edit `appsettings.json` and update the connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EVRentalFeedbackDB;Trusted_Connection=True;TrustServerCertificate=True"
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

### Rating
- Required
- Must be between 1 and 5

### Comment
- Optional
- Maximum length: 1000 characters

### UserId
- Required
- Maximum length: 450 characters

### BookingId & CarId
- Required
- Must be valid integers

---

## Business Rules

1. **One Feedback Per Booking**: A user can only submit one feedback per booking.
2. **Soft Delete**: Feedbacks are never permanently deleted, only marked as inactive.
3. **UTC Timestamps**: All timestamps are stored in UTC.
4. **Auto Timestamps**: CreatedAt is automatically set on creation, UpdatedAt on modification.

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
  "message": "Feedback not found",
  "data": null
}
```

---

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns (UserId, CarId, BookingId)
2. **Async Operations**: All database operations are asynchronous
3. **Soft Delete**: Improves performance by avoiding actual deletions
4. **LINQ Optimization**: Efficient query generation with Entity Framework

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement pagination for list endpoints
- [ ] Add filtering and sorting options
- [ ] Implement caching for average ratings
- [ ] Add notification system for new feedbacks
- [ ] Implement rating breakdown (5-star, 4-star, etc.)
- [ ] Add image upload for feedbacks
- [ ] Implement sentiment analysis for comments

---

## License
This project is part of the EV Station-based Rental System.

## Contact
For questions or support, please contact the development team.

