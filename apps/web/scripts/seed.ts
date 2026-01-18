/**
 * Seed Script for Income Options Cockpit
 *
 * This script initializes the database with default data:
 * - Default workspace
 * - Default settings version
 * - Symbol universe
 *
 * Run with: pnpm --filter @cockpit/web seed
 */

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SYMBOLS, getDefaultSettings } from '@cockpit/engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Starting seed...');

  // Note: In production, workspaces are created automatically when users sign up
  // This seed is for development/testing purposes

  console.log('\n=== Seed Instructions ===');
  console.log('1. Sign up for an account at http://localhost:3000/signup');
  console.log('2. A default workspace will be created automatically');
  console.log('3. The default symbol universe includes:', DEFAULT_SYMBOLS.join(', '));
  console.log('4. Default settings use the "balanced" preset');
  console.log('\nTo add symbols to a workspace, use the Settings page in the UI.\n');

  // Print default settings for reference
  const defaultSettings = getDefaultSettings('balanced');
  console.log('=== Default Balanced Settings ===');
  console.log(JSON.stringify(defaultSettings, null, 2));

  console.log('\nSeed info complete.');
}

seed().catch(console.error);
