require('dotenv').config();
const db = require('../src/config/database');

// Usage:
// node scripts/cleanup-communications-json.js --dry-run
// node scripts/cleanup-communications-json.js --apply

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');

async function tryParseJSON(value) {
  if (value === null || value === undefined) return { ok: true, parsed: null };
  if (typeof value === 'object') return { ok: true, parsed: value };
  try {
    const p = JSON.parse(value);
    return { ok: true, parsed: p };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function run() {
  try {
    console.log('Scanning communications table for malformed JSON (metadata, read_by)');
    const [rows] = await db.query('SELECT id, metadata, read_by FROM communications');
    const bad = [];
    for (const r of rows) {
      const m = await tryParseJSON(r.metadata);
      const rb = await tryParseJSON(r.read_by);
      if (!m.ok || !rb.ok) {
        bad.push({ id: r.id, metadata: r.metadata, read_by: r.read_by, metadata_ok: m.ok, read_by_ok: rb.ok });
      }
    }

    console.log(`Found ${bad.length} rows with malformed JSON`);
    if (bad.length === 0) {
      process.exit(0);
    }

    if (!APPLY) {
      console.log('Dry-run mode (no changes). To apply fixes run with --apply');
      console.table(bad.map(b => ({ id: b.id, metadata_ok: b.metadata_ok, read_by_ok: b.read_by_ok, metadata: b.metadata, read_by: b.read_by })));
      process.exit(0);
    }

    console.log('Applying fixes...');
    for (const b of bad) {
      // Normalize: set metadata to NULL if invalid; set read_by to JSON '[]' if invalid or NULL
      const newMetadata = b.metadata_ok ? b.metadata : null;
      const newReadBy = b.read_by_ok ? b.read_by : JSON.stringify([]);
      await db.query('UPDATE communications SET metadata = ?, read_by = ? WHERE id = ?', [newMetadata, newReadBy, b.id]);
      console.log('Fixed id', b.id);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
}

run();
