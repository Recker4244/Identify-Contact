'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Contact.init({
    phoneNumber: DataTypes.STRING,
    email: DataTypes.STRING,
    linkedId: DataTypes.STRING,
    linkPrecedence: DataTypes.ENUM('secondary', 'primary'),
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Contact',
  });
  return Contact;
};