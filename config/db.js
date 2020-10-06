const mongoose = require('mongoose');
require('dotenv').config({
  path: 'environment.env'
});

const mongooseConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
    console.log('db is connected');
  } catch (error) {
    console.log('ocurrió un error: ');
    console.log('error :>> ', error);
    process.exit(1); // Detiene la aplicación
  }
}

module.exports = mongooseConnect;