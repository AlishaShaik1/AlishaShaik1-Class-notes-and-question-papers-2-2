// backend/src/config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('WARNING: Supabase URL or Key not set in .env — file uploads will fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
export const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'pec-notes';
