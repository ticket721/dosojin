import { Receptacle, Dosojin, Gem, TransferReceptacleStatusNames } from '../core';
import { Stripe } from 'stripe';
import BN = require('bn.js');
import { StripeDosojin } from '.';
import { SECOND, MINUTE } from '../core/ActionEntity';

export class CardPayoutReceptacle extends Receptacle {

    public dosojin: StripeDosojin;

    constructor(dosojin: StripeDosojin) {
        super('CardPayoutReceptacle', dosojin);
        this.refreshTimer = 5 * SECOND;
    }

    public async run(gem: Gem): Promise<Gem> {
        const poResource: Stripe.PayoutsResource = this.dosojin.getStripePoResource();

        if (gem.getState(this.dosojin)) {

            if (gem.getState(this.dosojin).payoutId) {
                const poId = gem.getState(this.dosojin).payoutId;

                try {
                    const payout: Stripe.Payout = await poResource.retrieve(poId);

                    if (!(payout.type === 'card')) {
                        gem.setGemStatus('Error');

                        throw new Error('This Receptacle can manage only card Payout');
                    }

                    if (payout.status === 'failed') {
                        gem.setGemStatus('Error');

                        throw new Error(`Payout failed for the following reason: ${payout.failure_message} (${payout.failure_code})`);
                    }

                    if (payout.status === 'canceled') {
                        gem.setGemStatus('Error');

                        throw new Error(`Payout was canceled for the following reason: ${payout.failure_message} (${payout.failure_code})`);
                    }

                    if (payout.status === 'in_transit') {
                        this.refreshTimer = 15 * MINUTE;
                    }

                    if (payout.status === 'paid') {
                        // gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount);

                        // gem.addCost(
                        //     this.dosojin,
                        //     new BN(paymentIntent.amount),
                        //     `fiat_${paymentIntent.currency}`,
                        //     `Stripe checkout with card: ${paymentIntent.description}`
                        // );

                        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
                    }

                    gem.setState(this.dosojin, { refreshTimer: this.refreshTimer });

                    return gem; 

                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain any payoutId property`);
            }
        } else {
            throw new Error(`gem state does not contain a ${this.dosojin.name} Dosojin property`);
        }
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        const poResource: Stripe.PayoutsResource = this.dosojin.getStripePoResource();
        
        if (gem.getState(this.dosojin)) {

            if (gem.getState(this.dosojin).payoutId) {
                const poId = gem.getState(this.dosojin).payoutId;

                try {
                    const payout: Stripe.Payout = await poResource.retrieve(poId);

                    if (!(payout.type === 'card')) {
                        gem.setGemStatus('Error');

                        throw new Error('This Receptacle can manage only card Payout');
                    }
                    // gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount);

                    // gem.addCost(
                    //     this.dosojin,
                    //     new BN(paymentIntent.amount),
                    //     `fiat_${paymentIntent.currency}`,
                    //     `Stripe checkout with card: ${paymentIntent.description}`
                    // );

                    return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);

                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain any payoutId property`);
            }
        } else {
            throw new Error(`gem state does not contain a ${this.dosojin.name} Dosojin property`);
        }
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_*'];
    }

    // CardPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector will ever ask for any informations about CardPaymentIntentReceptacle
    public async getReceptacleInfo(gem: Gem): Promise<any> {
        return ;
    }

    // CardPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector informations will ever been set by CardPaymentIntentReceptacle
    public async setConnectorInfo(info: any): Promise<void> {
        return ;
    }
}