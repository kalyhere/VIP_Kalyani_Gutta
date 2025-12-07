import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../config/constants.js';

export const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1', // Optional: skip rate limiting for local development
}); 