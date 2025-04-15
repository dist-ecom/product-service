import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

async function monitorRedis() {
  console.log('Starting Redis monitor...');
  
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  console.log(`Connecting to Redis at ${redisHost}:${redisPort}`);
  
  // Using docker exec to run the MONITOR command directly
  const dockerCommand = `docker exec shared-redis redis-cli MONITOR`;
  
  console.log('Starting Redis monitoring...');
  const monitor = exec(dockerCommand);
  
  monitor.stdout?.on('data', (data) => {
    console.log(data);
  });
  
  monitor.stderr?.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  monitor.on('close', (code) => {
    console.log(`Monitor process exited with code ${code}`);
  });
  
  console.log('Redis monitoring started. Press Ctrl+C to exit.');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping Redis monitor...');
    monitor.kill();
    process.exit(0);
  });
}

monitorRedis().catch(err => {
  console.error('Error in Redis monitor:', err);
  process.exit(1);
}); 