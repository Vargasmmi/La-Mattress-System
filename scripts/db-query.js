import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgres://admin:Atec2019chino@168.231.92.67:5436/shopify-db?sslmode=disable';

const client = new Client({
  connectionString: connectionString,
});

async function queryDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\nAvailable tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Look for user-related tables
    const userTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('user') ||
      row.table_name.toLowerCase().includes('employee') ||
      row.table_name.toLowerCase().includes('auth')
    );

    if (userTables.length > 0) {
      console.log('\nUser-related tables found:');
      for (const table of userTables) {
        console.log(`\n=== Table: ${table.table_name} ===`);
        
        // Get table structure
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [table.table_name]);
        
        console.log('Columns:');
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });

        // Get sample data
        const dataResult = await client.query(`
          SELECT * FROM ${table.table_name} LIMIT 5;
        `);
        
        console.log(`\nSample data (${dataResult.rows.length} rows):`);
        console.log(JSON.stringify(dataResult.rows, null, 2));
      }
    }

  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

queryDatabase();