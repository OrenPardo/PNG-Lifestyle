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

// Early preload hints — browser starts fetching before HTML is parsed
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Link', [
      '</tailwind.css?v=5>; rel=preload; as=style',
      '</logo.webp>; rel=preload; as=image; type=image/webp',
      '<https://fonts.googleapis.com>; rel=preconnect',
      '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
    ].join(', '));
  }
  next();
});

// Static files with production-grade cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// 404 — redirect to homepage instead of serving index.html as 404 content
app.use((req, res) => {
  res.redirect(301, '/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving on port ${PORT}`);
});
