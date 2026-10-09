import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pposmcwbhofhwcpoiunp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwb3NtY3diaG9maHdjcG9pdW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MDIxNTMsImV4cCI6MjEwNDQ3ODE1M30.-ePo4Lh5DhjnkaIHAaH6CTban3UWBGWCTjXzU0q7N0E'

export const supabase = createClient(supabaseUrl, supabaseKey)