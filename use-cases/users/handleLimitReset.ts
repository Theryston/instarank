import { plan, user } from '@prisma/client';
import { BaseError } from '../../errors';
import prisma from '../../lib/prisma';
import { HandleLimitResetDTO } from './dto';

export async function handleLimitReset({
  userId,
  requestId,
}: HandleLimitResetDTO) {
  let user: user & { plan: plan };
  try {
    user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        plan: true,
      },
    });
  } catch (error) {
    throw new BaseError({
      message: error.message,
      errorLocationCode:
        'handleLimitReset.ts:handleLimitReset:prisma.user.findUnique',
      requestId,
      statusCode: 500,
    });
  }

  if (!user) {
    throw new BaseError({
      message: 'User not found',
      errorLocationCode:
        'handleLimitReset.ts:handleLimitReset:prisma.user.findUnique',
      requestId,
      statusCode: 404,
    });
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoTimestamp = oneMonthAgo.getTime();
  const limitResetTimestamp = user.limitResetAt.getTime();
  const now = new Date();

  if (limitResetTimestamp < oneMonthAgoTimestamp) {
    try {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          limitResetAt: now,
          monthlyLimit: user.plan.monthlyLimit,
        },
      });
    } catch (error) {
      throw new BaseError({
        message: error.message,
        errorLocationCode:
          'handleLimitReset.ts:handleLimitReset:prisma.user.update',
        requestId,
        statusCode: 500,
      });
    }

    return {
      monthlyLimit: user.plan.monthlyLimit,
      limitResetAt: now,
    };
  }

  return {
    monthlyLimit: user.monthlyLimit,
    limitResetAt: user.limitResetAt,
  };
}