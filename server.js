require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const downloadRoutes = require('./routes/downloadRoutes');

const app = express();
const port = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL ;


app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());


app.use('/api', downloadRoutes);


if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}


app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Frontend URL: ${frontendUrl}`);
});
