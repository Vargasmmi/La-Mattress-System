-- Seed data for LA Mattress Call Center
-- This file contains initial data for testing

-- Insert test admin user (password: admin123)
-- Note: In production, use proper bcrypt hashed passwords
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@lamattress.com', '$2b$10$rBpVJSmx0hGYPcKoGCjcVuLv7jD9fO0q8ENfhYJ0YBXKqHV9Cq6fK', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert test employees (password for all: employee123)
DO $$
DECLARE
    store_rec RECORD;
    user_id UUID;
    i INTEGER;
BEGIN
    FOR store_rec IN SELECT id, code FROM stores LOOP
        FOR i IN 1..10 LOOP
            -- Create user
            INSERT INTO users (email, password_hash, name, role, employee_code, store_id)
            VALUES (
                LOWER(store_rec.code) || i || '@lamattress.com',
                '$2b$10$rBpVJSmx0hGYPcKoGCjcVuLv7jD9fO0q8ENfhYJ0YBXKqHV9Cq6fK',
                'Employee ' || store_rec.code || i,
                'employee',
                store_rec.code || LPAD(i::text, 3, '0'),
                store_rec.id
            )
            ON CONFLICT (email) DO NOTHING
            RETURNING id INTO user_id;
            
            -- Create employee record
            IF user_id IS NOT NULL THEN
                INSERT INTO employees (user_id, store_id, employee_code, hire_date, phone)
                VALUES (
                    user_id,
                    store_rec.id,
                    store_rec.code || LPAD(i::text, 3, '0'),
                    CURRENT_DATE - (random() * 365)::integer,
                    '+1' || LPAD(FLOOR(random() * 9999999999)::text, 10, '0')
                )
                ON CONFLICT (user_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Insert sample call clients
INSERT INTO call_clients (name, phone, email, address, priority, language_preference, notes) VALUES
    ('John Smith', '+1234567890', 'john.smith@email.com', '123 Main St, Los Angeles, CA', 'normal', 'en', 'Interested in king size mattresses'),
    ('Maria Garcia', '+1234567891', 'maria.garcia@email.com', '456 Oak Ave, Los Angeles, CA', 'high', 'es', 'Previous customer, looking for upgrade'),
    ('David Johnson', '+1234567892', 'david.j@email.com', '789 Pine Rd, Los Angeles, CA', 'normal', 'en', 'First time buyer'),
    ('Sarah Williams', '+1234567893', 'sarah.w@email.com', '321 Elm St, Los Angeles, CA', 'vip', 'en', 'Bulk order for hotel'),
    ('Michael Brown', '+1234567894', 'michael.b@email.com', '654 Maple Dr, Los Angeles, CA', 'normal', 'en', 'Referred by friend'),
    ('Jennifer Davis', '+1234567895', 'jennifer.d@email.com', '987 Cedar Ln, Los Angeles, CA', 'high', 'en', 'Repeat customer'),
    ('Robert Miller', '+1234567896', 'robert.m@email.com', '147 Birch Way, Los Angeles, CA', 'normal', 'en', 'Comparing prices'),
    ('Lisa Anderson', '+1234567897', 'lisa.a@email.com', '258 Spruce Ct, Los Angeles, CA', 'normal', 'en', 'Needs financing options'),
    ('James Wilson', '+1234567898', 'james.w@email.com', '369 Willow Pl, Los Angeles, CA', 'high', 'en', 'Corporate account'),
    ('Patricia Taylor', '+1234567899', 'patricia.t@email.com', '741 Ash Blvd, Los Angeles, CA', 'normal', 'en', 'Looking for eco-friendly options')
ON CONFLICT DO NOTHING;

-- Assign clients to random employees
DO $$
DECLARE
    client_rec RECORD;
    random_employee UUID;
BEGIN
    FOR client_rec IN SELECT id FROM call_clients WHERE assigned_employee_id IS NULL LOOP
        SELECT id INTO random_employee FROM employees ORDER BY random() LIMIT 1;
        UPDATE call_clients SET assigned_employee_id = random_employee WHERE id = client_rec.id;
    END LOOP;
END $$;

-- Insert additional call scripts
INSERT INTO call_scripts (title, category, content, language, effectiveness_rating) VALUES
    ('Objection Handling - Price', 'objection', 'I understand price is important. Let me share how our mattresses actually save you money in the long run...', 'en', 4.2),
    ('Objection Handling - Need to Think', 'objection', 'I completely understand wanting to think it over. What specific concerns can I address for you right now?', 'en', 3.8),
    ('Benefit Focus - Health', 'product', 'Did you know that quality sleep directly impacts your health? Our orthopedic mattresses are designed...', 'en', 4.5),
    ('Benefit Focus - Warranty', 'product', 'All our mattresses come with a 10-year warranty, which means we stand behind our quality...', 'en', 4.1),
    ('Special Offer Script', 'closing', 'For today only, I can offer you our premium package at 20% off, plus free delivery...', 'en', 4.7),
    ('Introduction Script - Spanish', 'opening', 'Buenos días/tardes, mi nombre es [Su Nombre] de LA Mattress. ¿Cómo está usted hoy?', 'es', 4.3),
    ('Product Presentation - Spanish', 'product', 'Le llamo para informarle sobre nuestra promoción especial en colchones premium...', 'es', 4.0)
ON CONFLICT DO NOTHING;

-- Create sample calls and feedback for the current month
DO $$
DECLARE
    emp_rec RECORD;
    client_rec RECORD;
    call_id UUID;
    days_back INTEGER;
BEGIN
    FOR emp_rec IN SELECT id FROM employees LIMIT 20 LOOP
        -- Create 5-15 calls per employee for current month
        FOR i IN 1..5 + FLOOR(random() * 10)::integer LOOP
            SELECT id INTO client_rec FROM call_clients WHERE assigned_employee_id = emp_rec.id ORDER BY random() LIMIT 1;
            
            IF client_rec.id IS NOT NULL THEN
                days_back := FLOOR(random() * 28)::integer;
                
                INSERT INTO calls (
                    client_id, 
                    employee_id, 
                    call_date,
                    duration_seconds,
                    status,
                    outcome
                ) VALUES (
                    client_rec.id,
                    emp_rec.id,
                    CURRENT_DATE - days_back,
                    60 + FLOOR(random() * 600)::integer,
                    CASE WHEN random() < 0.8 THEN 'completed' ELSE 'no_answer' END,
                    CASE 
                        WHEN random() < 0.2 THEN 'sale'
                        WHEN random() < 0.4 THEN 'interested'
                        WHEN random() < 0.6 THEN 'callback'
                        WHEN random() < 0.8 THEN 'not_interested'
                        ELSE 'no_decision'
                    END
                ) RETURNING id INTO call_id;
                
                -- Add feedback for completed calls (80% chance)
                IF random() < 0.8 THEN
                    INSERT INTO call_feedback (
                        call_id,
                        employee_id,
                        client_mood,
                        interest_level,
                        feedback_text,
                        follow_up_required,
                        follow_up_date
                    ) VALUES (
                        call_id,
                        emp_rec.id,
                        CASE 
                            WHEN random() < 0.6 THEN 'positive'
                            WHEN random() < 0.9 THEN 'neutral'
                            ELSE 'negative'
                        END,
                        1 + FLOOR(random() * 5)::integer,
                        'Client feedback for call. ' || 
                        CASE WHEN random() < 0.5 
                            THEN 'Customer showed interest in our products.' 
                            ELSE 'Customer needs more time to decide.' 
                        END,
                        random() < 0.3,
                        CASE WHEN random() < 0.3 THEN CURRENT_DATE + FLOOR(random() * 14)::integer ELSE NULL END
                    );
                    
                    -- Update call with feedback timestamp
                    UPDATE calls SET feedback_submitted_at = CURRENT_TIMESTAMP WHERE id = call_id;
                END IF;
                
                -- Create sale record if outcome was sale
                IF EXISTS (SELECT 1 FROM calls WHERE id = call_id AND outcome = 'sale') THEN
                    INSERT INTO sales (
                        call_id,
                        employee_id,
                        client_id,
                        amount,
                        product_details,
                        status
                    ) VALUES (
                        call_id,
                        emp_rec.id,
                        client_rec.id,
                        500 + FLOOR(random() * 2000)::integer,
                        jsonb_build_object(
                            'product', CASE FLOOR(random() * 4)::integer
                                WHEN 0 THEN 'Twin Mattress'
                                WHEN 1 THEN 'Queen Mattress'
                                WHEN 2 THEN 'King Mattress'
                                ELSE 'California King Mattress'
                            END,
                            'quantity', 1,
                            'discount', FLOOR(random() * 20)::integer
                        ),
                        'confirmed'
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create sample subscriptions
INSERT INTO subscriptions (
    customer_name,
    customer_email,
    employee_id,
    subscription_link,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    start_date,
    next_billing_date
)
SELECT 
    'Customer ' || row_number() OVER (),
    'customer' || row_number() OVER () || '@example.com',
    e.id,
    'https://lamattress.com/subscribe/' || e.employee_code,
    'cus_test_' || gen_random_uuid()::text,
    'sub_test_' || gen_random_uuid()::text,
    CASE WHEN random() < 0.8 THEN 'active' ELSE 'cancelled' END,
    CURRENT_DATE - (random() * 90)::integer,
    CURRENT_DATE + (random() * 30)::integer
FROM employees e
CROSS JOIN generate_series(1, 3)
WHERE random() < 0.3
LIMIT 30;

-- Calculate and insert commissions for current month
INSERT INTO commissions (employee_id, month, base_sales, base_commission, bonus_tier, bonus_amount, total_commission)
SELECT 
    e.id,
    DATE_TRUNC('month', CURRENT_DATE),
    calc.base_sales,
    calc.base_commission,
    calc.bonus_tier,
    calc.bonus_amount,
    calc.total_commission
FROM employees e
CROSS JOIN LATERAL calculate_commission(e.id, DATE_TRUNC('month', CURRENT_DATE)) calc
WHERE calc.base_sales > 0
ON CONFLICT (employee_id, month) DO UPDATE SET
    base_sales = EXCLUDED.base_sales,
    base_commission = EXCLUDED.base_commission,
    bonus_tier = EXCLUDED.bonus_tier,
    bonus_amount = EXCLUDED.bonus_amount,
    total_commission = EXCLUDED.total_commission;

-- Output summary
SELECT 
    'Data seeding completed!' as message,
    (SELECT COUNT(*) FROM users WHERE role = 'employee') as employees_created,
    (SELECT COUNT(*) FROM call_clients) as clients_created,
    (SELECT COUNT(*) FROM calls) as calls_created,
    (SELECT COUNT(*) FROM sales) as sales_created,
    (SELECT COUNT(*) FROM subscriptions) as subscriptions_created,
    (SELECT COUNT(*) FROM commissions) as commissions_calculated;