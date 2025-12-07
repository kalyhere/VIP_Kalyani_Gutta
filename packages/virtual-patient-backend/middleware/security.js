import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import express from 'express';
import { helmetConfig, corsConfig } from '../config/security.js';
import { MAX_REQUEST_SIZE } from '../config/constants.js';

export const configureSecurityMiddleware = (app) => {
  // Apply Helmet security headers
  app.use(helmet(helmetConfig));

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Parse JSON with size limit and validation
  app.use(express.json({ 
    limit: MAX_REQUEST_SIZE,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));

  // Configure CORS
  app.use(cors(corsConfig));
}; 