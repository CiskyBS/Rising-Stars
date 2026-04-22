import { createClient } from '@supabase/supabase-js';

// Questi valori verranno popolati automaticamente quando aggiungerai l'integrazione Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);