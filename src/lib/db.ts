import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as {
  connPool: Pool | undefined;
};

export const pool =
  globalForDb.connPool ||
  new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for AWS RDS connections
    },
    max: 10, // Prevent connection exhaustion on small RDS instances
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.connPool = pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
