const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Generate CSS cache-busting hash from file content at startup
const cssPath = path.join(__dirname, 'public', 'tailwind.css');
const cssHash = crypto.createHash('md5').update(fs.readFileSync(cssPath)).digest('hex').slice(0, 8);

// Pre-render index.html with the CSS hash baked in
const rawHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const indexHtml = rawHtml.replace(/__CSS_HASH__/g, cssHash);

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
      `</tailwind.css?v=${cssHash}>; rel=preload; as=style`,
      '</logo.webp>; rel=preload; as=image; type=image/webp',
      '<https://fonts.googleapis.com>; rel=preconnect',
      '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
    ].join(', '));
  }
  next();
});

// Serve index.html with CSS hash injected
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(indexHtml);
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
  console.log(`Serving on port ${PORT} (CSS hash: ${cssHash})`);
});
