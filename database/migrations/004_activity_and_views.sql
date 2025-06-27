-- Migration: 004_activity_and_views
-- Description: Activity logging and useful database views

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Create employee performance view
CREATE OR REPLACE VIEW employee_performance AS
SELECT 
    e.id,
    e.employee_code,
    u.name,
    u.email,
    s.name as store_name,
    COUNT(DISTINCT c.id) as total_calls,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_calls,
    COUNT(DISTINCT c.id) FILTER (WHERE c.outcome = 'sale') as successful_sales,
    COUNT(DISTINCT cf.id) as feedbacks_submitted,
    ROUND(AVG(cf.interest_level), 2) as avg_interest_level,
    DATE_TRUNC('month', CURRENT_DATE) as month
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN stores s ON e.store_id = s.id
LEFT JOIN calls c ON e.id = c.employee_id 
    AND DATE_TRUNC('month', c.call_date) = DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN call_feedback cf ON c.id = cf.call_id
WHERE u.is_active = true
GROUP BY e.id, e.employee_code, u.name, u.email, s.name;

-- Create daily call summary view
CREATE OR REPLACE VIEW daily_call_summary AS
SELECT 
    DATE(c.call_date) as call_date,
    s.name as store_name,
    COUNT(DISTINCT c.id) as total_calls,
    COUNT(DISTINCT c.employee_id) as active_employees,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_calls,
    COUNT(DISTINCT c.id) FILTER (WHERE c.outcome = 'sale') as sales,
    COUNT(DISTINCT cf.id) as feedbacks,
    ROUND(AVG(c.duration_seconds), 0) as avg_call_duration
FROM calls c
JOIN employees e ON c.employee_id = e.id
JOIN stores s ON e.store_id = s.id
LEFT JOIN call_feedback cf ON c.id = cf.call_id
GROUP BY DATE(c.call_date), s.name
ORDER BY call_date DESC, store_name;

-- Create commission summary view
CREATE OR REPLACE VIEW commission_summary AS
SELECT 
    c.month,
    s.name as store_name,
    COUNT(DISTINCT c.employee_id) as employees_count,
    SUM(c.base_sales) as total_sales,
    SUM(c.base_commission) as total_base_commission,
    SUM(c.bonus_amount) as total_bonus,
    SUM(c.total_commission) as total_commission,
    COUNT(DISTINCT c.employee_id) FILTER (WHERE c.bonus_tier = 'bronze') as bronze_count,
    COUNT(DISTINCT c.employee_id) FILTER (WHERE c.bonus_tier = 'silver') as silver_count,
    COUNT(DISTINCT c.employee_id) FILTER (WHERE c.bonus_tier = 'gold') as gold_count,
    COUNT(DISTINCT c.employee_id) FILTER (WHERE c.bonus_tier = 'platinum') as platinum_count
FROM commissions c
JOIN employees e ON c.employee_id = e.id
JOIN stores s ON e.store_id = s.id
GROUP BY c.month, s.name
ORDER BY c.month DESC, s.name;

-- Create client assignment view
CREATE OR REPLACE VIEW client_assignments AS
SELECT 
    cc.id as client_id,
    cc.name as client_name,
    cc.phone as client_phone,
    cc.priority,
    e.id as employee_id,
    u.name as employee_name,
    e.employee_code,
    s.name as store_name,
    COUNT(c.id) as total_calls,
    MAX(c.call_date) as last_call_date,
    bool_or(cf.follow_up_required) as needs_follow_up
FROM call_clients cc
LEFT JOIN employees e ON cc.assigned_employee_id = e.id
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN stores s ON e.store_id = s.id
LEFT JOIN calls c ON cc.id = c.client_id
LEFT JOIN call_feedback cf ON c.id = cf.call_id
GROUP BY cc.id, cc.name, cc.phone, cc.priority, e.id, u.name, e.employee_code, s.name;

-- Create function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get employee stats
CREATE OR REPLACE FUNCTION get_employee_stats(
    p_employee_id UUID,
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    total_calls INTEGER,
    completed_calls INTEGER,
    successful_sales INTEGER,
    conversion_rate DECIMAL,
    avg_call_duration INTEGER,
    total_commission DECIMAL,
    current_tier VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id)::INTEGER as total_calls,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed')::INTEGER as completed_calls,
        COUNT(DISTINCT c.id) FILTER (WHERE c.outcome = 'sale')::INTEGER as successful_sales,
        CASE 
            WHEN COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') > 0 
            THEN ROUND(
                COUNT(DISTINCT c.id) FILTER (WHERE c.outcome = 'sale')::DECIMAL / 
                COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') * 100, 
                2
            )
            ELSE 0
        END as conversion_rate,
        COALESCE(ROUND(AVG(c.duration_seconds), 0), 0)::INTEGER as avg_call_duration,
        COALESCE(MAX(com.total_commission), 0) as total_commission,
        COALESCE(MAX(com.bonus_tier), 'none') as current_tier
    FROM employees e
    LEFT JOIN calls c ON e.id = c.employee_id 
        AND c.call_date >= p_start_date 
        AND c.call_date <= p_end_date
    LEFT JOIN commissions com ON e.id = com.employee_id 
        AND com.month = DATE_TRUNC('month', p_start_date)
    WHERE e.id = p_employee_id
    GROUP BY e.id;
END;
$$ LANGUAGE plpgsql;