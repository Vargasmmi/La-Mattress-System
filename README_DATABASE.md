# Database Setup Instructions

## PostgreSQL Connection

The system is configured to use the following PostgreSQL database:

```
Host: 168.231.92.67
Port: 5436
Database: shopify-db
User: admin
Password: Atec2019chino
SSL: disabled
```

**Important Note**: The `coupons` table already exists in this database. Do not attempt to recreate it.

## Running Migrations

To set up the database schema, run the migrations in order:

```bash
# Connect to the database
psql postgres://admin:Atec2019chino@168.231.92.67:5436/shopify-db?sslmode=disable

# Run migrations in order
\i database/migrations/001_initial_setup.sql
\i database/migrations/002_call_management.sql
\i database/migrations/003_sales_and_commissions.sql
\i database/migrations/004_activity_and_views.sql

# Optional: Load seed data for testing
\i database/seed.sql
```

## Database Schema Overview

### Core Tables

1. **stores** - Physical store locations
2. **users** - Authentication and user accounts
3. **employees** - Employee profiles linked to users
4. **call_clients** - Customer contacts for calling
5. **calls** - Call records and outcomes
6. **call_feedback** - Post-call feedback from employees
7. **call_scripts** - Call scripts and templates
8. **sales** - Sales transactions
9. **subscriptions** - Stripe subscription tracking
10. **commissions** - Monthly commission calculations
11. **activity_logs** - System activity tracking

### Key Features

- UUID primary keys for security
- Automatic timestamp updates via triggers
- Indexes on foreign keys and frequently queried fields
- Database views for reporting
- Functions for commission calculations
- Comprehensive activity logging

### Database Views

- **employee_performance** - Monthly performance metrics
- **daily_call_summary** - Daily call statistics by store
- **commission_summary** - Commission overview by store
- **client_assignments** - Client-employee assignment overview

### Important Functions

- `calculate_commission(employee_id, month)` - Calculate monthly commissions
- `get_employee_stats(employee_id, start_date, end_date)` - Get employee statistics
- `log_activity(...)` - Log system activities

## API Integration

The frontend is configured to connect to the API using the `dataProvider.ts` file. Make sure to:

1. Set the `VITE_API_URL` environment variable in your `.env` file
2. Implement the backend API according to the documentation in `API_DOCUMENTATION.md`
3. Handle JWT authentication tokens properly

## Security Notes

1. Never commit the `.env` file with real credentials
2. Use proper password hashing (bcrypt) in production
3. Implement proper SSL/TLS in production
4. Regular database backups are recommended
5. Monitor the activity_logs table for security auditing

## Next Steps

1. Create the backend API server using Node.js/Express or your preferred framework
2. Implement the endpoints documented in `API_DOCUMENTATION.md`
3. Set up Stripe webhook handling for subscription management
4. Configure proper CORS settings for your frontend URL
5. Implement real-time updates using WebSockets (optional)

## Admin Access

After running the seed data, you can login with:
- Email: admin@lamattress.com
- Password: admin123

**Important**: Change this password immediately in production!

## Employee Access

Test employees are created with the pattern:
- Email: [store_code][number]@lamattress.com (e.g., ctr1@lamattress.com)
- Password: employee123

Each store has 10 employees numbered 1-10.