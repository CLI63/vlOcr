const { initializeSchema } = require('../services/schemaService');

initializeSchema()
  .then(() => {
    console.log('Database initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  });
