const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../../src/config/config');

const setupTestDB = () => {
  const mongoServer = new MongoMemoryServer();
  beforeAll(async () => {
    return mongoServer.getUri().then((uri) => {
      return mongoose.connect(uri, config.mongoose.options);
    });
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
};

module.exports = setupTestDB;
