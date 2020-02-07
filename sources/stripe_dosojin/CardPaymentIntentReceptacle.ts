import { Receptacle, Dosojin, Gem, TransferReceptacleStatusNames } from '../core';
import { Stripe } from 'stripe';
import BN = require('bn.js');
import { StripeDosojin } from '.';
import { SECOND } from '../core/ActionEntity';

export class CardPaymentIntentReceptacle extends Receptacle {

    public dosojin: StripeDosojin;

    constructor(dosojin: StripeDosojin) {
        super('CardPaymentIntentReceptacle', dosojin);
        this.refreshTimer = 5 * SECOND;
    }

    public async run(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();

        if (gem.getState(this.dosojin)) {

            if (gem.getState(this.dosojin).paymentIntentId) {
                const piId = gem.getState(this.dosojin).paymentIntentId;

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(piId);

                    if (paymentIntent.status === 'succeeded') {
                        gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount);

                        gem.addCost(
                            this.dosojin,
                            new BN(paymentIntent.amount),
                            `fiat_${paymentIntent.currency}`,
                            `Stripe checkout with card: ${paymentIntent.description}`
                        );

                        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
                    }

                    if (paymentIntent.status === 'canceled') {
                        gem.setGemStatus('Error');

                        throw new Error('Payment intent was canceled');
                    }

                    gem.setState(this.dosojin, { refreshTimer: this.refreshTimer });

                    return gem; 

                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain any paymentIntentId property`);
            }
        } else {
            throw new Error(`gem state does not contain a ${this.dosojin.name} Dosojin property`);
        }
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();
        
        if (gem.getState(this.dosojin)) {

            if (gem.getState(this.dosojin).paymentIntentId) {
                const piId = gem.getState(this.dosojin).paymentIntentId;

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(piId);

                    gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount);

                    gem.addCost(
                        this.dosojin,
                        new BN(paymentIntent.amount),
                        `fiat_${paymentIntent.currency}`,
                        `Stripe checkout with card: ${paymentIntent.description}`
                    );

                    return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);

                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain any paymentIntentId property`);
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