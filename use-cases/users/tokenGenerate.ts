import { BaseError } from '../../errors';
import prisma from '../../lib/prisma';
import * as jwt from 'jsonwebtoken';
import { user } from '@prisma/client';
import { TokenGenerateDTO } from './dto';

export async function tokenGenerate({
  email,
  requestId,
  refreshToken,
}: TokenGenerateDTO) {
  if (!email && !refreshToken) {
    throw new BaseError({
      message: 'Email or refresh token is required',
      errorLocationCode: 'tokenGenerate.ts:tokenGenerate',
      requestId,
      statusCode: 400,
    });
  }

  if (refreshToken) {
    return await handleRefreshToken(refreshToken, requestId);
  }

  if (email) {
    return await handleEmail(email, requestId);
  }
}

async function handleRefreshToken(refreshToken: string, requestId: string) {
  let decodedToken: jwt.JwtPayload;
  try {
    decodedToken = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload;
  } catch (error) {
    throw new BaseError({
      message: error.message,
      errorLocationCode: 'tokenGenerate.ts:tokenGenerate:jwt.verify',
      requestId,
      statusCode: 500,
    });
  }

  if (!decodedToken) {
    throw new BaseError({
      message: 'Refresh token is invalid',
      errorLocationCode: 'tokenGenerate.ts:tokenGenerate:jwt.verify',
      requestId,
      statusCode: 401,
    });
  }

  let user: user;
  try {
    user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
    });
  } catch (error) {
    throw new BaseError({
      message: error.message,
      errorLocationCode:
        'tokenGenerate.ts:tokenGenerate:prisma.user.findUnique',
      requestId,
      statusCode: 500,
    });
  }

  if (!user) {
    throw new BaseError({
      message: 'User not found',
      errorLocationCode:
        'tokenGenerate.ts:tokenGenerate:prisma.user.findUnique',
      requestId,
      statusCode: 404,
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ip: user.ip,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '4m',
    }
  );
  const newRefreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ip: user.ip,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );

  return {
    token,
    refreshToken: newRefreshToken,
    tokenExpiresIn: 4 * 60,
    refreshTokenExpiresIn: 30 * 24 * 60 * 60,
  };
}

async function handleEmail(email: string, requestId: string) {
  let user: user;
  try {
    user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
  } catch (error) {
    throw new BaseError({
      message: error.message,
      errorLocationCode:
        'tokenGenerate.ts:tokenGenerate:prisma.user.findUnique',
      requestId,
      statusCode: 500,
    });
  }

  if (!user) {
    throw new BaseError({
      message: 'User not found',
      errorLocationCode:
        'tokenGenerate.ts:tokenGenerate:prisma.user.findUnique',
      requestId,
      statusCode: 404,
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ip: user.ip,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '4m',
    }
  );
  const refreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ip: user.ip,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );

  return {
    token,
    refreshToken,
    tokenExpiresIn: 4 * 60,
    refreshTokenExpiresIn: 30 * 24 * 60 * 60,
  };
}