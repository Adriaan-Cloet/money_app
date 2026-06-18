import { createClient } from '@supabase/supabase-js'
import type { Database } from '../models/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Supabase env-variabelen ontbreken. Check je .env-bestand.')
}

export const supabase = createClient<Database>(url, key)