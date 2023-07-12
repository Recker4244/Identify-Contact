// istanbul ignore file
import {Sequelize} from 'sequelize';
import {ContactInstance} from './contact';
const env = process.env.NODE_ENV || 'development';
const config = require('../../database/config/config.js')[env];

interface Database {
  sequelize: Sequelize;
  Contact: ContactInstance;
}

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db: Database = {
  sequelize,
  Contact: require('./contact').default,
};

export default db;
