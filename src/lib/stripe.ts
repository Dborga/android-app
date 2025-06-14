import {
  initPaymentSheet,
  presentPaymentSheet,
  initStripe,
} from '@stripe/stripe-react-native';
import { supabase } from './supabase';
import { CollectionMode } from '@stripe/stripe-react-native/lib/typescript/src/types/PaymentSheet';

// Initialize Stripe once when your app starts
export const initializeStripe = async () => {
  await initStripe({
    publishableKey: 'YOUR_PUBLISHABLE_KEY', // Replace with your actual key
    merchantIdentifier: 'merchant.com.your.app', // For Apple Pay
  });
};

const fetchStripeKeys = async (totalAmount: number) => {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      totalAmount,
    },
  });

  if (error) throw new Error(error.message);
  return data;
};

export const setupStripePaymentSheet = async (totalAmount: number) => {
  // Fetch paymentIntent and publishable key from server
  const { paymentIntent, publicKey, ephemeralKey, customer } =
    await fetchStripeKeys(totalAmount);

  if (!paymentIntent || !publicKey) {
    throw new Error('Failed to fetch Stripe keys');
  }

  // Initialize Stripe with the public key
  await initStripe({
    publishableKey: publicKey,
  });

  const { error } = await initPaymentSheet({
    merchantDisplayName: 'Codewithlari',
    paymentIntentClientSecret: paymentIntent,
    customerId: customer,
    customerEphemeralKeySecret: ephemeralKey,
    returnURL: 'your-app-scheme://stripe-redirect', // Add your app's URL scheme
    billingDetailsCollectionConfiguration: {
      name: 'always' as CollectionMode,
      phone: 'always' as CollectionMode,
    },

    // Add default billing details if needed
    defaultBillingDetails: {
      name: 'Customer Name',
    },
  });

  if (error) {
    throw new Error(`Payment sheet initialization failed: ${error.message}`);
  }
};

export const openStripeCheckout = async () => {
  const { error } = await presentPaymentSheet();

  if (error) {
    throw new Error(error.message);
  }

  return true;
};