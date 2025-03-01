import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  
  // Display a more user-friendly error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e11d48;">Supabase Configuration Error</h1>
        <p>Missing Supabase credentials. To fix this:</p>
        <ol>
          <li>Create a <code>.env</code> file in the project root</li>
          <li>Add the following variables with your Supabase project values:
            <pre style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key</pre>
          </li>
          <li>Restart the development server</li>
        </ol>
        <p>You can find these values in your Supabase project dashboard under Project Settings > API.</p>
      </div>
    `;
  }
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};