// istanbul ignore file
import {Model, Optional, DataTypes} from 'sequelize';
import {sequelize} from './index';

export interface ContactAttributes {
  id: number;
  email?: string;
  phoneNumber?: number;
  linkPrecedence: string;
  linkedId?: number;
  deletedAt: Date;
}

export interface ContactCreationAttributes
  extends Optional<ContactAttributes, 'id'> {}

export interface ContactInstance
  extends Model<ContactAttributes, ContactCreationAttributes>,
    ContactAttributes {
  createdAt: Date;
  updatedAt: Date;
  findOne(options: object): Promise<ContactInstance>;
  destroy: (options?: any) => Promise<any>;
  findAll(options: object): Promise<ContactInstance[]>;
  create: (options?: any) => Promise<ContactInstance>;
}

const Contact = sequelize.define<ContactInstance>('Contacts', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  linkPrecedence: {
    type: DataTypes.ENUM,
    values: ['primary', 'secondary'],
    defaultValue: 'primary',
    allowNull: false,
  },
  linkedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default Contact;
