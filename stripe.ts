
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Creates a Stripe Checkout session for a course purchase
 */
export async function createCourseCheckoutSession({
  courseId,
  courseTitle,
  price,
  userId,
}: {
  courseId: string;
  courseTitle: string;
  price: number; // In cents
  userId: string;
}) {
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: courseTitle,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/cancel`,
    metadata: {
      courseId,
      userId,
    },
  });

  return checkoutSession;
}

/**
 * Creates a Stripe Checkout session for an exam voucher purchase
 */
export async function createVoucherCheckoutSession({
  enrollmentId,
  courseTitle,
  userId,
}: {
  enrollmentId: string;
  courseTitle: string;
  userId: string;
}) {
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Additional Exam Attempt - ${courseTitle}`,
          },
          unit_amount: 14900, // $149.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${enrollmentId.split('_')[0]}/view/exam?voucher_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${enrollmentId.split('_')[0]}/view/exam`,
    metadata: {
      type: 'exam_voucher',
      enrollmentId,
      userId,
    },
  });

  return checkoutSession;
}

/**
 * Verifies Stripe webhook signatures
 */
export function constructEvent(payload: string, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

export default stripe;
