const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./routes/auth').User; // wait auth.js exports router, not User
// well I can just require the User model directly
const UserModel = require('./models/User');

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log('URI:', uri);
  await mongoose.connect(uri);
  console.log('readyState:', mongoose.connection.readyState);
  
  try {
    const user = await UserModel.findOne({ email: 'test@example.com' });
    console.log('User found:', user);
  } catch (e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
}
run();
