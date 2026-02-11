-- Create custom types
CREATE TYPE service_type AS ENUM ('tow', 'battery_jump', 'flat_tire', 'fuel_delivery', 'minor_repair');
CREATE TYPE request_status AS ENUM ('pending', 'assigned', 'completed');

-- Create providers table
CREATE TABLE providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_types TEXT[] NOT NULL,
    coverage_area TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type service_type NOT NULL,
    user_phone TEXT NOT NULL,
    location_link TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_providers_active ON providers(active);
CREATE INDEX idx_requests_provider_id ON requests(provider_id);

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers table
-- Only authenticated users can read providers
CREATE POLICY "Providers are viewable by authenticated users" ON providers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert providers
CREATE POLICY "Providers can be created by authenticated users" ON providers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update providers
CREATE POLICY "Providers can be updated by authenticated users" ON providers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete providers
CREATE POLICY "Providers can be deleted by authenticated users" ON providers
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for requests table
-- Anyone can insert requests (public access for customers)
CREATE POLICY "Anyone can create requests" ON requests
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can read requests
CREATE POLICY "Requests are viewable by authenticated users" ON requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can update requests
CREATE POLICY "Requests can be updated by authenticated users" ON requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete requests
CREATE POLICY "Requests can be deleted by authenticated users" ON requests
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
