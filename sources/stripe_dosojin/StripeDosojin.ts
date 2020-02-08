import { CardPaymentIntentReceptacle } from './CardPaymentIntentReceptacle';
import { Dosojin } from '..';
import Stripe from 'stripe';
import { SepaDebitPaymentIntentReceptacle } from './SepaDebitPaymentIntentReceptacle';

export class StripeDosojin extends Dosojin {
    private stripe: Stripe;

    protected constructor(name: string, stripe: Stripe) {
        super(name);
        this.stripe = stripe;
        this.addReceptacle(new CardPaymentIntentReceptacle(this));
        this.addReceptacle(new SepaDebitPaymentIntentReceptacle(this));
    }

    public getStripePiResource(): Stripe.PaymentIntentsResource {
        return this.stripe.paymentIntents;
    }
}