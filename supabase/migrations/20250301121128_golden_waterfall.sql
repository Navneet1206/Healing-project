/*
  # Initial Schema for SAVAYAS HEALS

  1. New Tables
    - `users` - Stores user information and authentication details
    - `professionals` - Stores professional profiles and specializations
    - `availability` - Manages professional availability slots
    - `appointments` - Tracks appointment bookings
    - `payments` - Records payment transactions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for professionals to manage their profiles and availability
    - Add policies for admins to access all data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'professional', 'admin')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  bio TEXT NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update appointments table to reference payments
ALTER TABLE appointments 
ADD CONSTRAINT fk_payment 
FOREIGN KEY (payment_id) 
REFERENCES payments(id) 
ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
  ON users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for professionals table
CREATE POLICY "Anyone can view professional profiles" 
  ON professionals 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Professionals can update their own profile" 
  ON professionals 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.id = professionals.user_id
    )
  );

CREATE POLICY "Admins can manage all professional profiles" 
  ON professionals 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for availability table
CREATE POLICY "Anyone can view availability" 
  ON availability 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Professionals can manage their own availability" 
  ON availability 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM professionals 
      WHERE professionals.id = availability.professional_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all availability" 
  ON availability 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for appointments table
CREATE POLICY "Users can view their own appointments" 
  ON appointments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments" 
  ON appointments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
  ON appointments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view appointments booked with them" 
  ON appointments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM professionals 
      WHERE professionals.id = appointments.professional_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can update appointments booked with them" 
  ON appointments 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM professionals 
      WHERE professionals.id = appointments.professional_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointments" 
  ON appointments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for payments table
CREATE POLICY "Users can view their own payments" 
  ON payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" 
  ON payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can view payments for their appointments" 
  ON payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM appointments 
      JOIN professionals ON appointments.professional_id = professionals.id 
      WHERE appointments.id = payments.appointment_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments" 
  ON payments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_availability_professional_id ON availability(professional_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);