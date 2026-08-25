import { Router } from 'express';

import {
  sendOtpController,
  verifyOtpController,
  getMeController,
} from '../controllers/auth.controller';

import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/send-otp',
  sendOtpController,
);

router.post(
  '/verify-otp',
  verifyOtpController,
);
router.get(
  '/me',
  authenticate,
  getMeController,
);

export default router;