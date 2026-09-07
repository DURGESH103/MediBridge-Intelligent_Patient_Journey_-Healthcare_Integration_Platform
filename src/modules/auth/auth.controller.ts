import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { AuthTokens } from './auth.types';
import { env } from '../../config/env';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, tokens: AuthTokens): void {
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: `${env.apiPrefix}/auth`,
  });
}

function extractRefreshToken(req: Request): string {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token was not provided');
  }
  return token;
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.registerPatient(req.body);
    setRefreshCookie(res, tokens);
    sendSuccess(res, 201, 'Patient account registered successfully', {
      user,
      accessToken: tokens.accessToken,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);
    setRefreshCookie(res, tokens);
    sendSuccess(res, 200, 'Login successful', { user, accessToken: tokens.accessToken });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const currentRefreshToken = extractRefreshToken(req);
    const tokens = await authService.refresh(currentRefreshToken);
    setRefreshCookie(res, tokens);
    sendSuccess(res, 200, 'Token refreshed successfully', { accessToken: tokens.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const currentRefreshToken = extractRefreshToken(req);
    await authService.logout(currentRefreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: `${env.apiPrefix}/auth` });
    sendSuccess(res, 200, 'Logged out successfully');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.userId);
    sendSuccess(res, 200, 'Current user retrieved successfully', user);
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateOwnProfile(req.user!.userId, req.body.fullName);
    sendSuccess(res, 200, 'Profile updated successfully', user);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, 200, 'Password changed successfully');
  }),
};
