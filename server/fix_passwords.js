require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  
  await User.updateMany({ password: 'password123' }, { $set: { password: hash } });

  console.log('Fixed passwords');
  process.exit(0);
});
