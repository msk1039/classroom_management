const mysql = require('mysql2');
require('dotenv').config();
// const fs = require('fs');


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ...(process.env.MODE === 'production' ? {
    ssl: {
      ca: process.env.DB_CA_CERT,
      // key: fs.readFileSync('./certs/key.pem'),
      // cert: fs.readFileSync('./certs/cert.pem'),
      rejectUnauthorized: true,
    },
  } : {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL DB');
});

module.exports = db;
