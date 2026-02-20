const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Generate cache-busting hashes from file content at startup
function fileHash(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}
const cssHash = fileHash(path.join(__dirname, 'public', 'tailwind.css'));
const jsHash = fileHash(path.join(__dirname, 'public', 'app.js'));

// Pre-render index.html with hashes baked in
const rawHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const indexHtml = rawHtml
  .replace(/__CSS_HASH__/g, cssHash)
  .replace(/__JS_HASH__/g, jsHash);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https://lh3.googleusercontent.com', 'data:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
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

// Serve index.html with hashes injected
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

// 404 — temporary redirect (302) so search engines don't index bad URLs as moved
app.use((req, res) => {
  res.redirect(302, '/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving on port ${PORT} (CSS: ${cssHash}, JS: ${jsHash})`);
});
