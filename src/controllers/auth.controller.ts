import { Request, Response } from 'express';

import {
  sendOtp,
  verifyOtp,
  getCurrentUser,
} from '../services/auth.service';

import {
  AuthenticatedRequest,
} from '../middleware/auth.middleware';

export async function sendOtpController(
  req: Request,
  res: Response,
) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await sendOtp(phone);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Send OTP error:', error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to send OTP',
    });
  }
}

export async function verifyOtpController(
  req: Request,
  res: Response,
) {
  try {
    const {
      phone,
      otp,
      name,
    } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    const result = await verifyOtp(
      phone,
      otp,
      name,
    );

    return res.status(200).json({
      success: true,
      message: result.isNewUser
        ? 'Account created successfully'
        : 'Login successful',
      data: result,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'OTP verification failed',
    });
  }
}

export async function getMeController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await getCurrentUser(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'User not found',
    });
  }
}