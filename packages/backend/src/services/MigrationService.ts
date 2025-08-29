import { db } from '../config/database';
import path from 'path';
import fs from 'fs/promises';

export class MigrationService {
  private static readonly MIGRATION_TABLE = 'knex_migrations';
  private static readonly MIGRATION_LOCK_TABLE = 'knex_migrations_lock';
  private static readonly MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

  // Check if migrations table exists
  private static async migrationTableExists(): Promise<boolean> {
    try {
      const result = await db.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ?
        )
      `, [this.MIGRATION_TABLE]);
      
      return result.rows[0].exists;
    } catch (error) {
      console.error('Failed to check migration table existence:', error);
      return false;
    }
  }

  // Get list of applied migrations
  private static async getAppliedMigrations(): Promise<string[]> {
    try {
      const exists = await this.migrationTableExists();
      if (!exists) {
        return [];
      }

      const migrations = await db(this.MIGRATION_TABLE)
        .select('name')
        .orderBy('name');
      
      return migrations.map(m => m.name);
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      return [];
    }
  }

  // Get list of available migration files
  private static async getAvailableMigrations(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.MIGRATIONS_DIR);
      return files
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort();
    } catch (error) {
      console.error('Failed to read migrations directory:', error);
      return [];
    }
  }

  // Check migration status
  static async checkMigrationStatus(): Promise<{
    applied: string[];
    pending: string[];
    needsMigration: boolean;
    migrationTableExists: boolean;
  }> {
    try {
      const migrationTableExists = await this.migrationTableExists();
      const applied = await this.getAppliedMigrations();
      const available = await this.getAvailableMigrations();
      
      // Compare available migrations with applied migrations
      const pending = available.filter(migration => {
        const migrationName = migration.replace(/\.(ts|js)$/, '');
        return !applied.some(appliedMigration => 
          appliedMigration === migrationName || appliedMigration.endsWith(migrationName)
        );
      });

      return {
        applied,
        pending,
        needsMigration: pending.length > 0 || !migrationTableExists,
        migrationTableExists
      };
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return {
        applied: [],
        pending: [],
        needsMigration: true,
        migrationTableExists: false
      };
    }
  }

  // Run pending migrations
  static async runMigrations(): Promise<{
    success: boolean;
    migrationsRun: string[];
    error?: string;
  }> {
    try {
      console.log('🔄 Running database migrations...');
      
      // Use Knex migrate.latest() method
      const [batchNo, migrationsRun] = await db.migrate.latest({
        directory: this.MIGRATIONS_DIR,
        tableName: this.MIGRATION_TABLE,
        schemaName: 'public'
      });

      if (migrationsRun.length > 0) {
        console.log(`✅ Applied ${migrationsRun.length} migrations (batch ${batchNo}):`);
        migrationsRun.forEach((migration: string) => {
          console.log(`   - ${migration}`);
        });
      } else {
        console.log('✅ Database is already up to date');
      }

      return {
        success: true,
        migrationsRun
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        migrationsRun: [],
        error: error instanceof Error ? error.message : 'Unknown migration error'
      };
    }
  }

  // Check if database needs seeding
  static async needsSeeding(): Promise<boolean> {
    try {
      // Check if project_templates table has any data
      const templatesCount = await db('project_templates').count('* as count').first();
      return (templatesCount?.count as number) === 0;
    } catch (error) {
      // If table doesn't exist or error, assume we need seeding
      console.log('Unable to check seeding status, assuming seeding is needed');
      return true;
    }
  }

  // Run seeds
  static async runSeeds(): Promise<{
    success: boolean;
    seedsRun: string[];
    error?: string;
  }> {
    try {
      console.log('🌱 Running database seeds...');
      
      const seedsDir = path.join(__dirname, '../database/seeds');
      const [seedsRun] = await db.seed.run({
        directory: seedsDir
      });

      if (seedsRun.length > 0) {
        console.log(`✅ Applied ${seedsRun.length} seeds:`);
        seedsRun.forEach(seed => {
          console.log(`   - ${seed}`);
        });
      } else {
        console.log('✅ No seeds to run');
      }

      return {
        success: true,
        seedsRun
      };
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      return {
        success: false,
        seedsRun: [],
        error: error instanceof Error ? error.message : 'Unknown seeding error'
      };
    }
  }

  // Initialize database (run migrations and seeds if needed)
  static async initializeDatabase(): Promise<{
    success: boolean;
    migrationsRun: string[];
    seedsRun: string[];
    errors: string[];
  }> {
    const result = {
      success: true,
      migrationsRun: [] as string[],
      seedsRun: [] as string[],
      errors: [] as string[]
    };

    try {
      // Check migration status
      const status = await this.checkMigrationStatus();
      
      if (status.needsMigration) {
        console.log('📊 Database migrations needed');
        console.log(`   - Applied migrations: ${status.applied.length}`);
        console.log(`   - Pending migrations: ${status.pending.length}`);
        
        // Run migrations
        const migrationResult = await this.runMigrations();
        result.migrationsRun = migrationResult.migrationsRun;
        
        if (!migrationResult.success) {
          result.success = false;
          result.errors.push(migrationResult.error || 'Migration failed');
          return result;
        }
      } else {
        console.log('✅ Database migrations are up to date');
      }

      // Check if seeding is needed
      const needsSeeding = await this.needsSeeding();
      
      if (needsSeeding) {
        console.log('🌱 Database seeding needed');
        
        // Run seeds
        const seedResult = await this.runSeeds();
        result.seedsRun = seedResult.seedsRun;
        
        if (!seedResult.success) {
          result.success = false;
          result.errors.push(seedResult.error || 'Seeding failed');
        }
      } else {
        console.log('✅ Database seeding not needed');
      }

      if (result.success) {
        console.log('🎉 Database initialization completed successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown database initialization error');
      return result;
    }
  }

  // Rollback last migration batch (for development/testing)
  static async rollbackLastBatch(): Promise<{
    success: boolean;
    migrationsRolledBack: string[];
    error?: string;
  }> {
    try {
      console.log('🔄 Rolling back last migration batch...');
      
      const [batchNo, migrationsRolledBack] = await db.migrate.rollback({
        directory: this.MIGRATIONS_DIR,
        tableName: this.MIGRATION_TABLE,
        schemaName: 'public'
      });

      if (migrationsRolledBack.length > 0) {
        console.log(`✅ Rolled back ${migrationsRolledBack.length} migrations from batch ${batchNo}:`);
        migrationsRolledBack.forEach((migration: string) => {
          console.log(`   - ${migration}`);
        });
      } else {
        console.log('✅ No migrations to rollback');
      }

      return {
        success: true,
        migrationsRolledBack
      };
    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
      return {
        success: false,
        migrationsRolledBack: [],
        error: error instanceof Error ? error.message : 'Unknown rollback error'
      };
    }
  }

  // Get current migration version info
  static async getMigrationInfo(): Promise<{
    currentBatch: number | null;
    totalMigrations: number;
    lastMigrationTime: Date | null;
  }> {
    try {
      const exists = await this.migrationTableExists();
      if (!exists) {
        return {
          currentBatch: null,
          totalMigrations: 0,
          lastMigrationTime: null
        };
      }

      const result = await db(this.MIGRATION_TABLE)
        .select('batch', 'migration_time')
        .orderBy('migration_time', 'desc')
        .first();

      const totalCount = await db(this.MIGRATION_TABLE).count('* as count').first();

      return {
        currentBatch: result?.batch || null,
        totalMigrations: totalCount?.count as number || 0,
        lastMigrationTime: result?.migration_time ? new Date(result.migration_time) : null
      };
    } catch (error) {
      console.error('Failed to get migration info:', error);
      return {
        currentBatch: null,
        totalMigrations: 0,
        lastMigrationTime: null
      };
    }
  }
}