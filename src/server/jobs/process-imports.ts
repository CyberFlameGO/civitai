import { createJob } from './job';
import { prisma } from '~/server/db/client';
import { ImportStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { chunk } from 'lodash';
import { processImport } from '~/server/importers/importRouter';

export const processImportsJob = createJob(
  'process-imports',
  '1 */1 * * *',
  async () => {
    // Get pending import jobs that are older than 30 minutes
    const importJobs = await prisma.import.findMany({
      where: {
        status: ImportStatus.Pending,
        createdAt: dayjs().add(-30, 'M').toDate(),
      },
    });

    // Process the pending jobs
    for (const batch of chunk(importJobs, 10)) {
      try {
        await Promise.all(batch.map((job) => processImport(job)));
      } catch (e) {} // We handle this inside the processImport...
    }
  },
  {
    shouldWait: false,
  }
);
