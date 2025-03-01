/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Modify RLS policies for the users table
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to update their own data
    - Ensure admin users can manage all user data
    - Fix permissions for user operations
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create improved policies with proper checks
CREATE POLICY "Users can view their own data" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE POLICY "Users can update their own data" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" 
  ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users" 
  ON users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Ensure public access for authentication-related operations
ALTER TABLE users ENABLE ROW LEVEL SECURITY;