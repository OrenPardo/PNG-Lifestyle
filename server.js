const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https://lh3.googleusercontent.com', 'data:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

// Gzip compression
app.use(compression());

// Static files with production-grade cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      // HTML: always revalidate so users get fresh content
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      // Assets: 1-year immutable cache (filenames don't change, but Tailwind rebuild produces same name)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Fallback: any unknown path → index.html (single-page behaviour)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving on port ${PORT}`);
});
