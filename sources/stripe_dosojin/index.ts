import { Stripe } from 'stripe';

export const stripe = new Stripe('process.env.STRIPE_SECRET_KEY_TEST', {
    apiVersion: '2019-12-03',
});

export { StripeDosojin } from './StripeDosojin';
export { CardPaymentIntentReceptacle } from './CardPaymentIntentReceptacle';
export { SepaDebitPaymentIntentReceptacle } from './SepaDebitPaymentIntentReceptacle';
export { CardPayoutConnector } from './CardPayoutConnector';
export { BankAccountPayoutConnector } from './BankAccountPayoutConnector';
