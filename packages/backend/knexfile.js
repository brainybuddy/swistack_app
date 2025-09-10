require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL || 'postgresql://swistack:swistack@localhost:5432/swistack',
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts'
    }
  },
  production: {
    client: 'postgresql',
    connection: (() => {
      const url = process.env.DATABASE_URL;
      // Prefer full connection string if provided
      if (typeof url === 'string' && url.length > 0) {
        return {
          connectionString: url,
          // Only force TLS for managed providers that require it
          ssl: url.includes('neon.tech') ? { rejectUnauthorized: false } : false,
        };
      }
      // Fallback to discrete environment variables
      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = Number(process.env.POSTGRES_PORT || 5432);
      const database = process.env.POSTGRES_DB || 'swistack';
      const user = process.env.POSTGRES_USER || 'swistack';
      const password = process.env.POSTGRES_PASSWORD || 'swistack';
      return { host, port, database, user, password, ssl: false };
    })(),
    migrations: {
      directory: './dist/database/migrations'
    },
    seeds: {
      directory: './dist/database/seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
