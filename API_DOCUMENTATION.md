# LA Mattress Call Center API Documentation

## Overview
This document outlines the API endpoints structure for the LA Mattress Call Center Management System.

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.lamattress.com/api
```

## Authentication
All endpoints (except login and public endpoints) require JWT authentication.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### Authentication

#### POST /auth/login
Login user and receive JWT token.
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employee",
    "employeeCode": "CTR001"
  }
}
```

#### POST /auth/logout
Logout current user.

#### GET /auth/me
Get current user information.

### Users

#### GET /users
Get all users (Admin only).
Query params: ?page=1&limit=10&filter[role]=employee&sort=-created_at

#### GET /users/:id
Get specific user.

#### POST /users
Create new user (Admin only).
```json
{
  "email": "new@example.com",
  "password": "securepassword",
  "name": "New User",
  "role": "employee",
  "storeId": "store-uuid"
}
```

#### PUT /users/:id
Update user.

#### DELETE /users/:id
Delete user (Admin only).

### Employees

#### GET /employees
Get all employees with filters.

#### GET /employees/:id
Get specific employee details.

#### GET /employees/:id/stats
Get employee statistics.
Query params: ?period=month

#### POST /employees
Create new employee profile.
```json
{
  "userId": "user-uuid",
  "storeId": "store-uuid",
  "employeeCode": "CTR001",
  "hireDate": "2024-01-15",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### PUT /employees/:id
Update employee information.

### Call Clients

#### GET /call-clients
Get all call clients.
Query params: ?assigned_employee_id=uuid&priority=high

#### GET /call-clients/:id
Get specific client details.

#### POST /call-clients
Create new call client.
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St",
  "preferredContactTime": "morning",
  "languagePreference": "en",
  "priority": "normal",
  "notes": "Interested in premium mattresses"
}
```

#### PUT /call-clients/:id
Update client information.

#### POST /call-clients/assign
Assign clients to employee (Admin only).
```json
{
  "employeeId": "employee-uuid",
  "clientIds": ["client-uuid-1", "client-uuid-2"]
}
```

#### GET /call-clients/search
Search clients by name, phone, or email.
Query params: ?q=john

### Calls

#### GET /calls
Get all calls with filters.
Query params: ?employee_id=uuid&status=completed&date_from=2024-01-01

#### GET /calls/:id
Get specific call details.

#### POST /calls
Create new call record.
```json
{
  "clientId": "client-uuid",
  "scriptId": "script-uuid",
  "duration": 180,
  "status": "completed",
  "outcome": "interested"
}
```

#### PUT /calls/:id
Update call information.

#### POST /calls/:id/feedback
Submit feedback for a call.
```json
{
  "clientMood": "positive",
  "interestLevel": 4,
  "feedbackText": "Client was very interested in our premium line...",
  "followUpRequired": true,
  "followUpDate": "2024-03-15"
}
```

### Call Scripts

#### GET /call-scripts
Get all active call scripts.
Query params: ?category=opening&language=en

#### GET /call-scripts/:id
Get specific script.

#### GET /call-scripts/by-category
Get scripts grouped by category.

#### POST /call-scripts
Create new script (Admin only).
```json
{
  "title": "New Product Introduction",
  "category": "product",
  "content": "Script content here...",
  "language": "en"
}
```

#### PUT /call-scripts/:id
Update script.

#### DELETE /call-scripts/:id
Delete script (Admin only).

### Sales

#### GET /sales
Get all sales records.
Query params: ?employee_id=uuid&date_from=2024-01-01&status=confirmed

#### GET /sales/:id
Get specific sale details.

#### POST /sales
Record new sale.
```json
{
  "callId": "call-uuid",
  "clientId": "client-uuid",
  "amount": 999.99,
  "productDetails": {
    "product": "Premium King Mattress",
    "quantity": 1,
    "discount": 10
  }
}
```

#### PUT /sales/:id
Update sale information.

### Subscriptions

#### GET /subscriptions
Get all subscriptions.
Query params: ?employee_id=uuid&status=active

#### GET /subscriptions/:id
Get specific subscription.

#### POST /subscriptions/create
Create new Stripe subscription.
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "employeeCode": "CTR001",
  "paymentMethodId": "pm_stripe_id"
}
```

#### POST /subscriptions/:id/cancel
Cancel subscription.

#### POST /subscriptions/webhook
Stripe webhook endpoint (public).

### Commissions

#### GET /commissions
Get commissions for a specific month.
Query params: ?month=2024-02&employee_id=uuid

#### GET /commissions/calculate
Calculate commissions for current month.

#### POST /commissions/pay
Mark commissions as paid (Admin only).
```json
{
  "commissionIds": ["commission-uuid-1", "commission-uuid-2"],
  "paymentReference": "PAYMENT-REF-123"
}
```

### Dashboard

#### GET /dashboard/admin
Get admin dashboard data.

#### GET /dashboard/employee
Get employee dashboard data.

### Reports

#### GET /reports/daily-calls
Get daily call report.
Query params: ?date=2024-02-15&store_id=uuid

#### GET /reports/employee-performance
Get employee performance report.
Query params: ?month=2024-02&store_id=uuid

#### GET /reports/sales-summary
Get sales summary report.
Query params: ?period=month&group_by=store

### Export

#### GET /:resource/export
Export data in CSV or XLSX format.
Query params: ?format=csv&filters=...

Available resources:
- employees
- call-clients
- calls
- sales
- commissions

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

## Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Webhooks

### Stripe Webhooks
Endpoint: POST /subscriptions/webhook

Events handled:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

## Notes for Implementation

1. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters.

2. **Filtering**: Use `filter[field]=value` format for filtering results.

3. **Sorting**: Use `sort=field` for ascending or `sort=-field` for descending order.

4. **Dates**: All dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ).

5. **UUIDs**: All IDs are UUIDs for better security and scalability.

6. **Soft Deletes**: Most resources use soft deletes, so deleted items are not permanently removed.

7. **Activity Logging**: All actions are logged in the activity_logs table for auditing.

8. **Real-time Updates**: Consider implementing WebSocket connections for real-time updates on:
   - New client assignments
   - Call status updates
   - Commission calculations