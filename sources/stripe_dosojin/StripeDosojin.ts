import { CardPaymentIntentReceptacle } from './CardPaymentIntentReceptacle';
import { Dosojin } from '..';
import Stripe from 'stripe';
import { SepaDebitPaymentIntentReceptacle } from './SepaDebitPaymentIntentReceptacle';
import { CardPayoutConnector } from './CardPayoutConnector';
import { BankAccountPayoutConnector } from './BankAccountPayoutConnector';

export class StripeDosojin extends Dosojin {
    private stripe: Stripe;

    protected constructor(name: string, stripe: Stripe) {
        super(name);
        this.stripe = stripe;
        this.addReceptacle(new CardPaymentIntentReceptacle(this));
        this.addReceptacle(new SepaDebitPaymentIntentReceptacle(this));

        this.addConnector(new CardPayoutConnector(this));
        this.addConnector(new BankAccountPayoutConnector(this));
    }

    public getStripePiResource(): Stripe.PaymentIntentsResource {
        return this.stripe.paymentIntents;
    }

    public getStripePoResource(): Stripe.PayoutsResource {
        return this.stripe.payouts;
    }
}
