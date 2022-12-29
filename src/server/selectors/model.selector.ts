import { Prisma } from '@prisma/client';
import { imageSelect } from '~/server/selectors/image.selector';
import { getModelVersionDetailsSelect } from '~/server/selectors/modelVersion.selector';

export const getAllModelsSelect = Prisma.validator<Prisma.ModelSelect>()({
  id: true,
  name: true,
  type: true,
  nsfw: true,
  status: true,
  modelVersions: {
    orderBy: { index: 'asc' },
    take: 1,
    select: {
      images: {
        orderBy: {
          index: 'asc',
        },
        take: 1,
        select: {
          image: {
            select: imageSelect,
          },
        },
      },
    },
  },
  rank: {
    select: {
      downloadCountDay: true,
      downloadCountWeek: true,
      downloadCountMonth: true,
      downloadCountYear: true,
      downloadCountAllTime: true,
      commentCountDay: true,
      commentCountWeek: true,
      commentCountMonth: true,
      commentCountYear: true,
      commentCountAllTime: true,
      favoriteCountDay: true,
      favoriteCountWeek: true,
      favoriteCountMonth: true,
      favoriteCountYear: true,
      favoriteCountAllTime: true,
      ratingCountDay: true,
      ratingCountWeek: true,
      ratingCountMonth: true,
      ratingCountYear: true,
      ratingCountAllTime: true,
      ratingDay: true,
      ratingWeek: true,
      ratingMonth: true,
      ratingYear: true,
      ratingAllTime: true,
      downloadCountAllTimeRank: true,
      favoriteCountAllTimeRank: true,
      commentCountAllTimeRank: true,
      ratingCountAllTimeRank: true,
      ratingAllTimeRank: true,
    },
  },
});

export const getAllModelsWithVersionsSelect = Prisma.validator<Prisma.ModelSelect>()({
  id: true,
  name: true,
  description: true,
  type: true,
  poi: true,
  nsfw: true,
  user: {
    select: {
      image: true,
      username: true,
    },
  },
  modelVersions: {
    select: getModelVersionDetailsSelect,
    orderBy: { index: 'asc' },
  },
  tagsOnModels: {
    select: {
      tag: {
        select: { name: true },
      },
    },
  },
});

export const modelWithDetailsSelect = Prisma.validator<Prisma.ModelSelect>()({
  id: true,
  name: true,
  description: true,
  poi: true,
  nsfw: true,
  type: true,
  updatedAt: true,
  status: true,
  reportStats: {
    select: {
      ownershipProcessing: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
    },
  },
  modelVersions: {
    orderBy: { index: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      steps: true,
      epochs: true,
      createdAt: true,
      updatedAt: true,
      trainedWords: true,
      inaccurate: true,
      baseModel: true,
      images: {
        orderBy: {
          index: 'asc',
        },
        select: {
          index: true,
          image: {
            select: imageSelect,
          },
        },
      },
      rank: {
        select: {
          downloadCountAllTime: true,
          ratingCountAllTime: true,
          ratingAllTime: true,
        },
      },
      files: {
        orderBy: { primary: 'desc' },
        select: {
          id: true,
          url: true,
          sizeKB: true,
          name: true,
          type: true,
          format: true,
          pickleScanResult: true,
          pickleScanMessage: true,
          virusScanResult: true,
          virusScanMessage: true,
          scannedAt: true,
          rawScanResult: true,
          primary: true,
        },
      },
      // runStrategies: {
      //   select: {
      //     id: true,
      //     partnerId: true,
      //   },
      // },
    },
  },
  rank: {
    select: {
      downloadCountAllTime: true,
      ratingCountAllTime: true,
      ratingAllTime: true,
      favoriteCountAllTime: true,
    },
  },
  tagsOnModels: { select: { tag: true } },
});
