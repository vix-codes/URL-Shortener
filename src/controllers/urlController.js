const { isValidHttpUrl } = require('../utils/validateUrl');
const { createShortUrl, getUrlByCode, incrementClicks } = require('../services/urlService');

function getBaseUrl(req) {
  // Prefer explicit BASE_URL if set, else infer from request.
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

async function handleShorten(req, res, next) {
  try {
    const { url } = req.body || {};

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL. Only http/https URLs are allowed.' });
    }

    const row = await createShortUrl(url);
    const baseUrl = getBaseUrl(req);

    return res.status(201).json({
      shortUrl: `${baseUrl}/${row.short_code}`,
      shortCode: row.short_code,
      originalUrl: row.original_url,
      createdAt: row.created_at,
      clicks: row.clicks,
    });
  } catch (err) {
    return next(err);
  }
}

async function handleRedirect(req, res, next) {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string' || !/^[A-Za-z0-9_-]+$/.test(code)) {
      return res.status(400).json({ error: 'Invalid short code.' });
    }

    const row = await getUrlByCode(code);
    if (!row) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    incrementClicks(row.id, row.short_code);

    return res.redirect(302, row.original_url);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  handleShorten,
  handleRedirect,
};

