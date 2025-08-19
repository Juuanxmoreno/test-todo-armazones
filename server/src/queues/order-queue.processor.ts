import { Worker, Job } from 'bullmq';
import { generateUserOrderPDF } from '@utils/pdfGenerator';
import { sendOrderConfirmationEmail } from '@utils/sendOrderConfirmationEmail';
import { OrderUserResponseDto } from '@dto/order.dto';
import env from '@config/env';

const connection = {
  url: env.REDIS_URL,
};

export const orderWorker = new Worker(
  'orderQueue',
  async (job: Job) => {
    const { order } = job.data as { order: OrderUserResponseDto };
    const pdfBuffer = await generateUserOrderPDF(order);
    await sendOrderConfirmationEmail({
      to: order.user.email,
      order,
      pdfBuffer,
    });
  },
  { connection },
);
