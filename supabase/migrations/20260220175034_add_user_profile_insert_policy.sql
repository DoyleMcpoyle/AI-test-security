/*
  # Add INSERT policy for user_profiles

  ## Changes
  - Add policy to allow authenticated users to insert their own profile during signup
  
  ## Security
  - Users can only insert a profile for their own auth.uid()
  - Policy ensures id matches the authenticated user's id
*/

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);