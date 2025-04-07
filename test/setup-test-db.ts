import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '.env.test') });

async function setupTestDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Create test database
    const db = client.db('product-service-test');

    // Create collections
    await db.createCollection('products');

    // Create indexes
    await db.collection('products').createIndex({ name: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ tags: 1 });

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the setup
setupTestDatabase()
  .then(() => {
    console.log('Test database setup successful');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test database setup failed:', error);
    process.exit(1);
  });
