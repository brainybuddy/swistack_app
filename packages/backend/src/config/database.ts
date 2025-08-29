import knex from 'knex';
import { Model } from 'objection';

const knexConfig = require('../../knexfile');
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

export const db = knex(config);

// Initialize Objection.js
Model.knex(db);

export default db;