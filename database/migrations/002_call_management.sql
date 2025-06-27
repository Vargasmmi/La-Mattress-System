-- Migration: 002_call_management
-- Description: Tables for call management functionality

-- Create call clients table
CREATE TABLE IF NOT EXISTS call_clients (
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

-- Create call scripts table
CREATE TABLE IF NOT EXISTS call_scripts (
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

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
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

-- Create call feedback table
CREATE TABLE IF NOT EXISTS call_feedback (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_clients_assigned ON call_clients(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_call_clients_phone ON call_clients(phone);
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_employee_id ON calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(call_date);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_call_feedback_call_id ON call_feedback(call_id);

-- Apply triggers
DROP TRIGGER IF EXISTS update_call_clients_updated_at ON call_clients;
CREATE TRIGGER update_call_clients_updated_at BEFORE UPDATE ON call_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_call_scripts_updated_at ON call_scripts;
CREATE TRIGGER update_call_scripts_updated_at BEFORE UPDATE ON call_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample call scripts
INSERT INTO call_scripts (title, category, content, language) VALUES
    ('Introduction Script', 'opening', 'Good [morning/afternoon], my name is [Your Name] from LA Mattress. How are you today?', 'en'),
    ('Product Presentation', 'product', 'I''m calling to tell you about our special promotion on premium mattresses that can improve your sleep quality...', 'en'),
    ('Closing Script', 'closing', 'Based on what you''ve told me, I think our [Product] would be perfect for you. We''re offering a special discount today...', 'en')
ON CONFLICT DO NOTHING;