const cors = require('cors');

app.use(cors({
  origin: ['https://66adc58a-4277-466d-9316-764327f12d64-00-3s35booxl2x8t.riker.replit.dev', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



