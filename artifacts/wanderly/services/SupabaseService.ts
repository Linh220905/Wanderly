import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ypltbhwyzkqqxozhsamk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbHRiaHd5emtxcXhvemhzYW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNTU4MzAsImV4cCI6MjEwNDgzMTgzMH0.O1daIIqRs9P1oFeu2kbjvG4x3zJzrpHTIpJIoRekG2o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
