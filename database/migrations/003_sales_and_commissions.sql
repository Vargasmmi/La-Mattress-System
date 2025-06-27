-- Migration: 003_sales_and_commissions
-- Description: Tables for sales tracking and commission calculation

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
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

-- Create subscriptions table (Stripe integration)
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_employee_id ON subscriptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_employee_id ON commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_month ON commissions(month);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Apply triggers
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create commission calculation function
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