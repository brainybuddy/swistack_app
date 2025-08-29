const knex = require('knex');
const knexConfig = require('./packages/backend/knexfile.js');

const db = knex(knexConfig.development);

async function createMissingTables() {
  try {
    console.log('Creating missing tables...');
    
    // Create projects table
    const projectsExists = await db.schema.hasTable('projects');
    if (!projectsExists) {
      console.log('Creating projects table...');
      await db.schema.createTable('projects', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.string('name').notNullable();
        table.text('description').nullable();
        table.uuid('ownerId').notNullable().references('id').inTable('users');
        table.string('template').nullable();
        table.string('slug').unique();
        table.boolean('isPublic').defaultTo(false);
        table.string('status').defaultTo('active');
        table.json('settings').defaultTo('{}');
        table.json('environment').defaultTo('{}');
        table.datetime('lastAccessedAt').nullable();
        table.timestamps(true, true);
        
        table.index(['ownerId']);
        table.index(['template']);
        table.index(['status']);
        table.index(['isPublic']);
      });
      console.log('✅ projects table created');
    }
    
    // Create project_members table
    const membersExists = await db.schema.hasTable('project_members');
    if (!membersExists) {
      console.log('Creating project_members table...');
      await db.schema.createTable('project_members', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.uuid('projectId').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.uuid('userId').notNullable().references('id').inTable('users');
        table.string('role').notNullable(); // owner, editor, viewer
        table.timestamps(true, true);
        
        table.unique(['projectId', 'userId']);
        table.index(['userId']);
        table.index(['role']);
      });
      console.log('✅ project_members table created');
    }
    
    // Create project_files table
    const filesExists = await db.schema.hasTable('project_files');
    if (!filesExists) {
      console.log('Creating project_files table...');
      await db.schema.createTable('project_files', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.uuid('projectId').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.string('path').notNullable();
        table.string('name').notNullable();
        table.string('type').notNullable(); // file, directory
        table.string('mimeType').nullable();
        table.bigInteger('size').defaultTo(0);
        table.string('storageKey').nullable();
        table.text('content').nullable();
        table.string('encoding').defaultTo('utf8');
        table.boolean('isBinary').defaultTo(false);
        table.uuid('parentId').nullable().references('id').inTable('project_files');
        table.uuid('createdBy').notNullable().references('id').inTable('users');
        table.uuid('updatedBy').nullable().references('id').inTable('users');
        table.timestamps(true, true);
        
        table.unique(['projectId', 'path']);
        table.index(['projectId']);
        table.index(['type']);
        table.index(['parentId']);
        table.index(['createdBy']);
      });
      console.log('✅ project_files table created');
    }
    
    // Create templates table
    const templatesExists = await db.schema.hasTable('templates');
    if (!templatesExists) {
      console.log('Creating templates table...');
      await db.schema.createTable('templates', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.string('key').unique().notNullable();
        table.string('name').notNullable();
        table.text('description').nullable();
        table.string('category').notNullable();
        table.string('framework').nullable();
        table.string('language').notNullable();
        table.string('version').defaultTo('1.0.0');
        table.json('files').defaultTo('[]');
        table.json('dependencies').nullable();
        table.json('scripts').nullable();
        table.json('config').nullable();
        table.boolean('isOfficial').defaultTo(false);
        table.boolean('isActive').defaultTo(true);
        table.integer('downloads').defaultTo(0);
        table.uuid('createdBy').nullable().references('id').inTable('users');
        table.timestamps(true, true);
        
        table.index(['category']);
        table.index(['framework']);
        table.index(['language']);
        table.index(['isActive']);
      });
      console.log('✅ templates table created');
    }
    
    // Check all tables
    const result = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'knex_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 All tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

createMissingTables();