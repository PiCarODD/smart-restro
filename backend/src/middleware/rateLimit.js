const { TooManyRequestsError } = require('../utils/errors');

const rateLimitStore = new Map();

const cleanupInterval = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.windowStart + data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, cleanupInterval);

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 5,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let data = rateLimitStore.get(key);

    if (!data || now > data.windowStart + windowMs) {
      data = {
        count: 0,
        windowStart: now,
        windowMs
      };
      rateLimitStore.set(key, data);
    }

    data.count++;

    if (data.count > max) {
      const retryAfter = Math.ceil((data.windowStart + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message,
        retryAfter
      });
    }

    next();
  };
};

const pinLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const identifier = req.body?.identifier || req.ip;
    return `pin:${identifier}`;
  },
  message: 'Too many PIN login attempts. Please try again in 15 minutes.'
});

const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    const identifier = req.body?.email || req.ip;
    return `auth:${identifier}`;
  },
  message: 'Too many authentication attempts. Please try again later.'
});

module.exports = {
  createRateLimiter,
  pinLoginLimiter,
  authLimiter
};
