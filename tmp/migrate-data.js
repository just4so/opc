/**
 * Neon → Tencent Lighthouse PostgreSQL data migration
 * Reads all tables from Neon, writes to new server via pg module
 */
const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_1xqgHeS8MOZR@ep-green-voice-ao3azrko-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const NEW_URL = 'postgresql://opc_admin:OpcDb2026Secure@124.221.187.63:5432/opc';

// Tables to migrate in dependency order (foreign keys)
const TABLES = [
  'User',
  'Community',
  'Policy',
  'News',
  'Project',
  'CommunityReview',
  'CommunityClaim',
  'Comment',
  'Like',
  'Favorite',
  'Follow',
  'Notification',
  'Conversation',
  'ConversationParticipant',
  'Message',
  'Inquiry',
  'Post',
  'Progress',
  'Account',
  'OneTimeToken',
  'SiteSetting',
  '_CommunityManager',
  'radar_issues',
  'radar_runs',
  'radar_items',
  'radar_cb_articles',
];

async function migrateTable(src, dst, table) {
  const quoted = table.startsWith('_') ? `"${table}"` : `"${table}"`;
  
  // Get row count
  const countRes = await src.query(`SELECT count(*) FROM ${quoted}`);
  const total = parseInt(countRes.rows[0].count);
  
  if (total === 0) {
    console.log(`  ${table}: 0 rows, skipping`);
    return 0;
  }

  // Get all rows
  const rows = await src.query(`SELECT * FROM ${quoted}`);
  
  if (rows.rows.length === 0) return 0;

  // Get column names from first row
  const cols = Object.keys(rows.rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  
  // Batch insert (100 rows at a time)
  const BATCH = 100;
  let inserted = 0;
  
  for (let i = 0; i < rows.rows.length; i += BATCH) {
    const batch = rows.rows.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let paramIdx = 1;
    
    for (const row of batch) {
      const placeholders = cols.map(c => {
        params.push(row[c]);
        return `$${paramIdx++}`;
      });
      values.push(`(${placeholders.join(', ')})`);
    }
    
    const sql = `INSERT INTO ${quoted} (${colList}) VALUES ${values.join(', ')} ON CONFLICT DO NOTHING`;
    await dst.query(sql, params);
    inserted += batch.length;
  }
  
  console.log(`  ${table}: ${inserted}/${total} rows migrated`);
  return inserted;
}

async function main() {
  console.log('Connecting to Neon (source)...');
  const src = new Client({ connectionString: NEON_URL });
  await src.connect();
  console.log('Connected to Neon ✓');

  console.log('Connecting to Lighthouse (destination)...');
  const dst = new Client({ connectionString: NEW_URL });
  await dst.connect();
  console.log('Connected to Lighthouse ✓');

  // Disable FK checks during migration - truncate all tables first, then disable triggers
  for (const table of TABLES) {
    const quoted = table.startsWith('_') ? `"${table}"` : `"${table}"`;
    try {
      await dst.query(`ALTER TABLE ${quoted} DISABLE TRIGGER ALL`);
      await dst.query(`TRUNCATE ${quoted} CASCADE`);
    } catch(e) { /* table might not exist */ }
  }

  let totalRows = 0;
  console.log('\n--- Starting migration ---\n');

  for (const table of TABLES) {
    try {
      const count = await migrateTable(src, dst, table);
      totalRows += count;
    } catch (err) {
      console.error(`  ERROR on ${table}: ${err.message}`);
    }
  }

  // Re-enable triggers
  for (const table of TABLES) {
    const quoted = table.startsWith('_') ? `"${table}"` : `"${table}"`;
    try {
      await dst.query(`ALTER TABLE ${quoted} ENABLE TRIGGER ALL`);
    } catch(e) { /* ignore */ }
  }

  console.log(`\n--- Migration complete: ${totalRows} total rows ---`);

  await src.end();
  await dst.end();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
