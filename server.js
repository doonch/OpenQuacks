const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static assets with no-cache for index.html and sw.js
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path === '/sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve static assets from the current directory
app.use(express.static(path.join(__dirname, '.')));

// SPA Fallback
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
