import { getThreadCounts } from '@/services/emailService';
import { withApiHandler } from '@/lib/api/handler';

export async function GET(): Promise<Response> {
  return withApiHandler(async () => {
    return getThreadCounts();
  });
}
