import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as {
  connPool: Pool | undefined;
};

const poolConfig: any = {
  max: 10, // Prevent connection exhaustion on small RDS instances
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS connections
  }
};

if (connectionString) {
  // Strip query parameters like ?sslmode=require to prevent pg from overriding our ssl config
  poolConfig.connectionString = connectionString.split('?')[0];
}

export const pool = globalForDb.connPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.connPool = pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
