import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvgqriwbpcpgpcwyexte.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Z3FyaXdicGNwZ3Bjd3lleHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTQ1MTksImV4cCI6MjA5Mzk5MDUxOX0.fRR2iziPVHYGjPki7nZO8fo9FvH28QWSi7Y7Yk67QJY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)