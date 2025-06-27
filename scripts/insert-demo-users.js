import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const connectionString = 'postgres://admin:Atec2019chino@168.231.92.67:5436/shopify-db?sslmode=disable';

const client = new Client({
  connectionString: connectionString,
});

// Demo employees to insert
const demoEmployees = [
  {
    email: 'maria@lamattress.com',
    password: 'maria123',
    role: 'employee'
  },
  {
    email: 'juan@lamattress.com',
    password: 'juan123',
    role: 'employee'
  },
  {
    email: 'elena@lamattress.com',
    password: 'elena123',
    role: 'employee'
  },
  {
    email: 'admin@lamattress.com',
    password: 'admin123',
    role: 'admin'
  }
];

async function insertDemoUsers() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check if bcryptjs is installed
    console.log('\nInserting demo users...');
    
    for (const user of demoEmployees) {
      try {
        // Check if user already exists
        const checkResult = await client.query(
          'SELECT email FROM users WHERE email = $1',
          [user.email]
        );

        if (checkResult.rows.length > 0) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Generate a UUID for the user
        const id = crypto.randomUUID();
        
        // Insert the user
        await client.query(
          `INSERT INTO users (id, email, password, role, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [id, user.email, hashedPassword, user.role]
        );
        
        console.log(`✅ Inserted user: ${user.email}`);
      } catch (err) {
        console.error(`Error inserting user ${user.email}:`, err.message);
      }
    }

    // Display all users
    console.log('\n=== All users in database ===');
    const allUsers = await client.query('SELECT email, role FROM users ORDER BY created_at DESC');
    allUsers.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
  }
}

// Note: To run this script, you need to install bcryptjs first:
// npm install bcryptjs
console.log('Demo user insertion script');
console.log('NOTE: Run "npm install bcryptjs" before running this script');
console.log('\nPress Ctrl+C to cancel or wait to continue...\n');

setTimeout(() => {
  insertDemoUsers();
}, 3000);