import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UserPreference } from '../models/UserPreference';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { registerSchema, loginSchema } from '../utils/validators';
import { logger } from '../utils/logger';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
  return { accessToken, refreshToken };
};

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      const user = await User.create(data);

      // Create default preferences
      await UserPreference.create({ user: user._id });

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();

      setTokenCookies(res, accessToken, refreshToken);

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      const user = await User.findOne({ email: data.email });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isMatch = await user.comparePassword(data.password);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();

      setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token');
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = generateTokens(user._id.toString());
      user.refreshToken = tokens.refreshToken;
      await user.save();

      setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      res.json({
        success: true,
        data: { accessToken: tokens.accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        req.user.refreshToken = undefined;
        await req.user.save();
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      data: { user: req.user },
    });
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone, avatar } = req.body;
      const user = req.user!;

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (avatar) user.avatar = avatar;

      await user.save();

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};
