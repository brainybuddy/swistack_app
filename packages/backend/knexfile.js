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
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
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