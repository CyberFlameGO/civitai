import {
  deleteAnswer,
  getAnswerDetail,
  setAnswerVote,
  upsertAnswer,
} from './../services/answer.service';
import { GetByIdInput } from '~/server/schema/base.schema';
import { Context } from '~/server/createContext';
import { simpleUserSelect } from '~/server/selectors/user.selector';
import { getAnswers } from '~/server/services/answer.service';
import { throwDbError, throwNotFoundError } from '~/server/utils/errorHandling';
import { AnswerVoteInput, GetAnswersInput, UpsertAnswerInput } from './../schema/answer.schema';

export type GetAnswersProps = AsyncReturnType<typeof getAnswersHandler>;
export const getAnswersHandler = async ({
  ctx,
  input: { questionId },
}: {
  ctx: Context;
  input: GetAnswersInput;
}) => {
  try {
    const userId = ctx.user?.id;
    const items = await getAnswers({
      questionId,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: simpleUserSelect },
        rank: {
          select: {
            heartCountAllTime: true,
            crossCountAllTime: true,
            checkCountAllTime: true,
          },
        },
        reactions: {
          where: { userId },
          take: !userId ? 0 : undefined,
          select: {
            id: true,
            userId: true,
            reaction: true,
          },
        },
        votes: {
          where: { userId },
          take: !userId ? 0 : 1,
          select: { vote: true, userId: true },
        },
      },
    });
    if (!items) throw throwNotFoundError();
    return items.map(({ reactions, votes, ...item }) => ({
      ...item,
      userReactions: reactions,
      userVote: votes.length > 0 ? votes[0] : undefined,
    }));
  } catch (error) {
    throw throwDbError(error);
  }
};

export const getAnswerDetailHandler = async ({
  ctx,
  input: { id },
}: {
  ctx: Context;
  input: GetByIdInput;
}) => {
  try {
    return await getAnswerDetail({
      id,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: simpleUserSelect },
      },
    });
  } catch (error) {
    throw throwDbError(error);
  }
};

export const upsertAnswerHandler = async ({
  ctx,
  input,
}: {
  ctx: DeepNonNullable<Context>;
  input: UpsertAnswerInput;
}) => {
  try {
    return await upsertAnswer({ ...input, userId: ctx.user.id });
  } catch (error) {
    throw throwDbError(error);
  }
};

export const deleteAnswerHandler = async ({
  ctx,
  input: { id },
}: {
  ctx: DeepNonNullable<Context>;
  input: GetByIdInput;
}) => {
  try {
    return await deleteAnswer({ id });
  } catch (error) {
    throw throwDbError(error);
  }
};

export const setAnswerVoteHandler = async ({
  ctx,
  input,
}: {
  ctx: DeepNonNullable<Context>;
  input: AnswerVoteInput;
}) => {
  try {
    return await setAnswerVote({ ...input, userId: ctx.user.id });
  } catch (error) {
    throw throwDbError(error);
  }
};
