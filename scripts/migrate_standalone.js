
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

// Clean and Parse .env manually to avoid any module issues or shell parsing quirks
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envPath)) {
    console.log('Reading .env file...');
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    const lines = envConfig.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL=')) {
            // detailed clean up of quotes
            let val = trimmed.substring('DATABASE_URL='.length).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            connectionString = val;
            break;
        }
    }
}

if (!connectionString) {
    console.error('DATABASE_URL not found in environment or .env file');
    process.exit(1);
}

console.log('Connecting to database...');
const { Pool } = pkg;
const pool = new Pool({
    connectionString: connectionString,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Add is_visible to page_content');

        await client.query(`
      ALTER TABLE page_content 
      ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
    `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
