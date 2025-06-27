-- LA Mattress Call Center Database Schema
-- PostgreSQL Database Schema
-- Note: The 'coupons' table already exists in the database - do not recreate it

-- Connect to existing database
\c shopify-db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
    employee_code VARCHAR(20) UNIQUE,
    store_id UUID REFERENCES stores(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table (additional employee information)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    emergency_contact JSONB,
    daily_call_goal INTEGER DEFAULT 25,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Call clients table
CREATE TABLE call_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    preferred_contact_time VARCHAR(50),
    language_preference VARCHAR(20) DEFAULT 'en',
    notes TEXT,
    tags TEXT[],
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'vip')),
    assigned_employee_id UUID REFERENCES employees(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Call scripts table
CREATE TABLE call_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'en',
    effectiveness_rating DECIMAL(3,2) DEFAULT 0.00,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES call_clients(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    script_id UUID REFERENCES call_scripts(id),
    call_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'no_answer', 'busy', 'failed')),
    outcome VARCHAR(50) CHECK (outcome IN ('sale', 'interested', 'callback', 'not_interested', 'no_decision')),
    feedback TEXT,
    feedback_submitted_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    client_id UUID NOT NULL REFERENCES call_clients(id),
    amount DECIMAL(10,2) NOT NULL,
    product_details JSONB,
    sale_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (for Stripe integration)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    subscription_link VARCHAR(500) NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'pending', 'past_due')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commissions table
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    month DATE NOT NULL,
    base_sales INTEGER DEFAULT 0,
    base_commission DECIMAL(10,2) DEFAULT 0.00,
    bonus_tier VARCHAR(20) CHECK (bonus_tier IN ('none', 'bronze', 'silver', 'gold', 'platinum')),
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_date DATE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month)
);

-- Call feedback table (separate for better tracking)
CREATE TABLE call_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID UNIQUE NOT NULL REFERENCES calls(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    client_mood VARCHAR(20) CHECK (client_mood IN ('positive', 'neutral', 'negative')),
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5),
    feedback_text TEXT NOT NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table (for tracking all actions)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_call_clients_assigned ON call_clients(assigned_employee_id);
CREATE INDEX idx_calls_client_id ON calls(client_id);
CREATE INDEX idx_calls_employee_id ON calls(employee_id);
CREATE INDEX idx_calls_date ON calls(call_date);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_subscriptions_employee_id ON subscriptions(employee_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_commissions_employee_id ON commissions(employee_id);
CREATE INDEX idx_commissions_month ON commissions(month);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp trigger to all tables
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_clients_updated_at BEFORE UPDATE ON call_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_scripts_updated_at BEFORE UPDATE ON call_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO stores (name, code) VALUES
    ('Store Centro', 'CTR'),
    ('Store Norte', 'NOR'),
    ('Store Sur', 'SUR'),
    ('Store Este', 'EST'),
    ('Store Oeste', 'OES');

-- Create a default admin user (password: admin123 - should be changed immediately)
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@lamattress.com', '$2b$10$YourHashedPasswordHere', 'System Admin', 'admin');

-- Sample call scripts
INSERT INTO call_scripts (title, category, content, language) VALUES
    ('Introduction Script', 'opening', 'Good [morning/afternoon], my name is [Your Name] from LA Mattress. How are you today?', 'en'),
    ('Product Presentation', 'product', 'I''m calling to tell you about our special promotion on premium mattresses that can improve your sleep quality...', 'en'),
    ('Closing Script', 'closing', 'Based on what you''ve told me, I think our [Product] would be perfect for you. We''re offering a special discount today...', 'en');

-- Create views for common queries
CREATE VIEW employee_performance AS
SELECT 
    e.id,
    e.employee_code,
    u.name,
    s.name as store_name,
    COUNT(DISTINCT c.id) as total_calls,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_calls,
    COUNT(DISTINCT c.id) FILTER (WHERE c.outcome = 'sale') as successful_sales,
    DATE_TRUNC('month', CURRENT_DATE) as month
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN stores s ON e.store_id = s.id
LEFT JOIN calls c ON e.id = c.employee_id 
    AND DATE_TRUNC('month', c.call_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY e.id, e.employee_code, u.name, s.name;

-- Create function to calculate commissions
CREATE OR REPLACE FUNCTION calculate_commission(
    p_employee_id UUID,
    p_month DATE
) RETURNS TABLE (
    base_sales INTEGER,
    base_commission DECIMAL,
    bonus_tier VARCHAR,
    bonus_amount DECIMAL,
    total_commission DECIMAL
) AS $$
DECLARE
    v_sales_count INTEGER;
    v_base_commission DECIMAL;
    v_bonus_tier VARCHAR;
    v_bonus_amount DECIMAL;
    v_total_commission DECIMAL;
BEGIN
    -- Count sales for the month
    SELECT COUNT(*) INTO v_sales_count
    FROM sales
    WHERE employee_id = p_employee_id
    AND DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', p_month)
    AND status = 'confirmed';
    
    -- Calculate base commission (10% = $1 per sale)
    v_base_commission := v_sales_count * 1.00;
    
    -- Determine bonus tier and amount
    CASE 
        WHEN v_sales_count >= 200 THEN
            v_bonus_tier := 'platinum';
            v_bonus_amount := 300.00;
        WHEN v_sales_count >= 150 THEN
            v_bonus_tier := 'gold';
            v_bonus_amount := 200.00;
        WHEN v_sales_count >= 100 THEN
            v_bonus_tier := 'silver';
            v_bonus_amount := 100.00;
        WHEN v_sales_count >= 50 THEN
            v_bonus_tier := 'bronze';
            v_bonus_amount := 50.00;
        ELSE
            v_bonus_tier := 'none';
            v_bonus_amount := 0.00;
    END CASE;
    
    v_total_commission := v_base_commission + v_bonus_amount;
    
    RETURN QUERY SELECT 
        v_sales_count,
        v_base_commission,
        v_bonus_tier,
        v_bonus_amount,
        v_total_commission;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;