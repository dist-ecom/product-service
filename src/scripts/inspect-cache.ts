import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

// Check if --docker flag was passed
const useDocker = process.argv.includes('--docker');

async function inspectCacheWithDocker() {
  console.log('Inspecting Redis cache using Docker...');
  
  const execAsync = promisify(exec);
  
  try {
    // Get all keys
    console.log('Fetching keys...');
    const { stdout: keysOutput } = await execAsync('docker exec shared-redis redis-cli KEYS "*"');
    const keys = keysOutput.split('\n').filter(Boolean);
    
    console.log(`\nFound ${keys.length} keys in Redis:`);
    
    // Display keys grouped by type
    const productKeys = keys.filter(k => k.startsWith('product:'));
    const productsListKeys = keys.filter(k => k.startsWith('products:'));
    const searchKeys = keys.filter(k => k.startsWith('search:'));
    const otherKeys = keys.filter(k => !k.startsWith('product:') && !k.startsWith('products:') && !k.startsWith('search:'));
    
    if (productKeys.length > 0) {
      console.log('\n=== Individual Product Keys ===');
      for (const key of productKeys) {
        const { stdout: ttlOutput } = await execAsync(`docker exec shared-redis redis-cli TTL "${key}"`);
        console.log(`${key} (TTL: ${ttlOutput.trim()}s)`);
      }
    }
    
    if (productsListKeys.length > 0) {
      console.log('\n=== Products List Keys ===');
      for (const key of productsListKeys) {
        const { stdout: ttlOutput } = await execAsync(`docker exec shared-redis redis-cli TTL "${key}"`);
        console.log(`${key} (TTL: ${ttlOutput.trim()}s)`);
      }
    }
    
    if (searchKeys.length > 0) {
      console.log('\n=== Search Keys ===');
      for (const key of searchKeys) {
        const { stdout: ttlOutput } = await execAsync(`docker exec shared-redis redis-cli TTL "${key}"`);
        console.log(`${key} (TTL: ${ttlOutput.trim()}s)`);
      }
    }
    
    if (otherKeys.length > 0) {
      console.log('\n=== Other Keys ===');
      for (const key of otherKeys) {
        const { stdout: ttlOutput } = await execAsync(`docker exec shared-redis redis-cli TTL "${key}"`);
        console.log(`${key} (TTL: ${ttlOutput.trim()}s)`);
      }
    }
    
    // Select a sample key to display its value
    if (keys.length > 0) {
      const sampleKey = keys[0];
      console.log(`\nSample value for key "${sampleKey}":`);
      const { stdout: valueOutput } = await execAsync(`docker exec shared-redis redis-cli GET "${sampleKey}"`);
      try {
        // Try to parse as JSON for prettier display
        const parsed = JSON.parse(valueOutput.trim());
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // If not valid JSON, just show the raw value
        console.log(valueOutput.trim());
      }
    }
    
  } catch (error) {
    console.error('Error inspecting cache with Docker:', error);
  }
}

async function inspectCacheWithClient() {
  console.log('Inspecting Redis cache using Redis client...');
  
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  // Create Redis client
  const client = createClient({
    socket: {
      host: redisHost,
      port: redisPort,
    }
  });
  
  // Handle connection errors
  client.on('error', (err) => {
    console.error('Redis connection error:', err);
    process.exit(1);
  });
  
  try {
    await client.connect();
    console.log(`Connected to Redis at ${redisHost}:${redisPort}`);
    
    // Get all keys
    const keys = await client.keys('*');
    console.log(`\nFound ${keys.length} keys in Redis:`);
    
    // Display keys grouped by type
    const productKeys = keys.filter(k => k.startsWith('product:'));
    const productsListKeys = keys.filter(k => k.startsWith('products:'));
    const searchKeys = keys.filter(k => k.startsWith('search:'));
    const otherKeys = keys.filter(k => !k.startsWith('product:') && !k.startsWith('products:') && !k.startsWith('search:'));
    
    if (productKeys.length > 0) {
      console.log('\n=== Individual Product Keys ===');
      for (const key of productKeys) {
        const ttl = await client.ttl(key);
        console.log(`${key} (TTL: ${ttl}s)`);
      }
    }
    
    if (productsListKeys.length > 0) {
      console.log('\n=== Products List Keys ===');
      for (const key of productsListKeys) {
        const ttl = await client.ttl(key);
        console.log(`${key} (TTL: ${ttl}s)`);
      }
    }
    
    if (searchKeys.length > 0) {
      console.log('\n=== Search Keys ===');
      for (const key of searchKeys) {
        const ttl = await client.ttl(key);
        console.log(`${key} (TTL: ${ttl}s)`);
      }
    }
    
    if (otherKeys.length > 0) {
      console.log('\n=== Other Keys ===');
      for (const key of otherKeys) {
        const ttl = await client.ttl(key);
        console.log(`${key} (TTL: ${ttl}s)`);
      }
    }
    
    // Select a sample key to display its value
    if (keys.length > 0) {
      const sampleKey = keys[0];
      console.log(`\nSample value for key "${sampleKey}":`);
      const value = await client.get(sampleKey);
      try {
        // Try to parse as JSON for prettier display
        const parsed = JSON.parse(value || '{}');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // If not valid JSON, just show the raw value
        console.log(value);
      }
    }
    
  } catch (error) {
    console.error('Error inspecting cache:', error);
  } finally {
    // Close client connection
    await client.quit();
    console.log('\nRedis connection closed');
  }
}

async function inspectCache() {
  if (useDocker) {
    await inspectCacheWithDocker();
  } else {
    await inspectCacheWithClient();
  }
}

inspectCache().catch(err => {
  console.error('Error in cache inspection:', err);
  process.exit(1);
}); 