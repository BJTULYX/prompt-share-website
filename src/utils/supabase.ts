import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jklixayotkdpregxurfu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbGl4YXlvdGtkcHJlZ3h1cmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTI1OTAsImV4cCI6MjA5Mjk2ODU5MH0.JAWk_f6AM7T7WLmalCGrno6-eN9lCXtPpCbe6VLE9Ak'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
