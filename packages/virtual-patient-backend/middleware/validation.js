import { body } from 'express-validator';
import { MAX_MESSAGE_LENGTH } from '../config/constants.js';

export const validateChatInput = [
  body('message')
    .trim()
    .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
    .withMessage(`Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters`),
  body('sessionId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage('Invalid session ID')
]; 