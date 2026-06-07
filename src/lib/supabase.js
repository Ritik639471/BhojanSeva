import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key'

// We will only create a real client if we have real credentials.
// Otherwise, we'll export a mock to prevent the app from crashing while developing the UI.
export const isMockBackend = !import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
