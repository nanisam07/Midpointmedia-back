import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

interface AuthUser {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
}

interface VerifyOtpResult {
  user: AuthUser;
  token: string;
  isNewUser: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const OTP_EXPIRY_MINUTES = Number(
  process.env.OTP_EXPIRY_MINUTES || 5,
);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}

export async function sendOtp(phoneInput: string) {
  const phone = normalizePhone(phoneInput);

  if (!phone) {
    throw new Error('Phone number is required');
  }

  const otp = generateOtp();

  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  // Invalidate previous unverified OTPs for this phone.
  await pool.query(
    `
    UPDATE otp_verifications
    SET verified = true
    WHERE phone = $1
      AND verified = false
    `,
    [phone],
  );

  await pool.query(
    `
    INSERT INTO otp_verifications
      (phone, otp_hash, expires_at, attempts, verified)
    VALUES
      ($1, $2, $3, 0, false)
    `,
    [phone, otpHash, expiresAt],
  );

  // DEVELOPMENT MODE:
  // Replace this with an SMS provider later.
  console.log(`📱 OTP for ${phone}: ${otp}`);

  return {
    phone,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,

    // DEVELOPMENT ONLY.
    // Remove this before production.
    devOtp: otp,
  };
}

export async function verifyOtp(
  phoneInput: string,
  otp: string,
  name?: string,
): Promise<VerifyOtpResult> {
  const phone = normalizePhone(phoneInput);

  if (!phone || !otp) {
    throw new Error('Phone number and OTP are required');
  }

  const result = await pool.query(
    `
    SELECT *
    FROM otp_verifications
    WHERE phone = $1
      AND verified = false
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [phone],
  );

  if (result.rows.length === 0) {
    throw new Error('OTP not found or already used');
  }

  const otpRecord = result.rows[0];

  if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
    throw new Error('OTP has expired');
  }

  if (otpRecord.attempts >= 5) {
    throw new Error('Too many OTP attempts');
  }

  const validOtp = await bcrypt.compare(
    otp,
    otpRecord.otp_hash,
  );

  if (!validOtp) {
    await pool.query(
      `
      UPDATE otp_verifications
      SET attempts = attempts + 1
      WHERE id = $1
      `,
      [otpRecord.id],
    );

    throw new Error('Invalid OTP');
  }

  // Mark OTP as used.
  await pool.query(
    `
    UPDATE otp_verifications
    SET verified = true
    WHERE id = $1
    `,
    [otpRecord.id],
  );

  // Check existing user.
  const existingUser = await pool.query(
    `
    SELECT
      id,
      name,
      phone,
      role,
      is_verified,
      is_active
    FROM users
    WHERE phone = $1
    LIMIT 1
    `,
    [phone],
  );

  let user: AuthUser;
  let isNewUser = false;

  if (existingUser.rows.length === 0) {
    const newUser = await pool.query(
      `
      INSERT INTO users
        (name, phone, role, is_verified, is_active)
      VALUES
        ($1, $2, 'user', true, true)
      RETURNING
        id,
        name,
        phone,
        role,
        is_verified,
        is_active
      `,
      [name?.trim() || null, phone],
    );

    user = newUser.rows[0];
    isNewUser = true;
  } else {
    if (!existingUser.rows[0].is_active) {
      throw new Error('User account is inactive');
    }

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET
        is_verified = true,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        phone,
        role,
        is_verified,
        is_active
      `,
      [existingUser.rows[0].id],
    );

    user = updatedUser.rows[0];
  }

  const token = jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  );

  return {
    user,
    token,
    isNewUser,
  };
}

export async function getCurrentUser(
  userId: string,
): Promise<AuthUser> {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      phone,
      role,
      is_verified,
      is_active
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  if (!result.rows[0].is_active) {
    throw new Error('User account is inactive');
  }

  return result.rows[0];
}