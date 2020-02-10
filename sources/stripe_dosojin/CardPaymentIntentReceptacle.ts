import { Receptacle, Gem, TransferReceptacleStatusNames } from '../core';
import { Stripe } from 'stripe';
import BN = require('bn.js');
import { GenericStripeDosojin } from '.';
import { SECOND } from '../core/ActionEntity';

export class CardPaymentIntentReceptacle extends Receptacle {

    public dosojin: GenericStripeDosojin;

    constructor(dosojin: GenericStripeDosojin) {
        super('CardPaymentIntentReceptacle', dosojin);
        this.refreshTimer = 5 * SECOND;
    }

    public async run(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();

        if (gem.getState(this.dosojin)) {

            if (gem.getState(this.dosojin).paymentIntentId) {
                const piId = gem.getState(this.dosojin).paymentIntentId;

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(piId, {
                        expand: [ 'charges.data.balance_transaction' ],
                    });

                    if (!paymentIntent.payment_method_types.includes('card')) {
                        gem.setGemStatus('Error');

                        throw new Error('Payment intent with a different payment method than a card cannot be manage by this Receptacle');
                    }

                    if (paymentIntent.status === 'canceled') {
                        gem.setGemStatus('Error');

                        throw new Error('Payment intent was canceled');
                    }

                    if (paymentIntent.status === 'succeeded') {
                        const balanceTransaction: Stripe.BalanceTransaction =
                            paymentIntent.charges.data[0].balance_transaction as Stripe.BalanceTransaction;

                        gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount_received);

                        gem.addCost(
                            this.dosojin,
                            new BN(balanceTransaction.net),
                            `fiat_${balanceTransaction.currency}`,
                            `|stripe| Checkout with card (net_amount): ${paymentIntent.description}`,
                        );

                        for (const feeItem of balanceTransaction.fee_details) {
                            gem.addCost(
                                this.dosojin,
                                new BN(feeItem.amount),
                                `fiat_${feeItem.currency}`,
                                `|stripe| Checkout with card (${feeItem.type}): ${feeItem.description}`,
                            );
                        }

                        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
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
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(piId, {
                        expand: [ 'charges.data.balance_transaction' ],
                    });

                    if (!paymentIntent.payment_method_types.includes('card')) {
                        gem.setGemStatus('Error');

                        throw new Error('Payment intent with a different payment method than a card cannot be manage by this Receptacle');
                    }

                    const balanceTransaction: Stripe.BalanceTransaction =
                        paymentIntent.charges.data[0].balance_transaction as Stripe.BalanceTransaction;

                    gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount_received);

                    gem.addCost(
                        this.dosojin,
                        new BN(balanceTransaction.net),
                        `fiat_${balanceTransaction.currency}`,
                        `|stripe| Checkout with card (net_amount): ${paymentIntent.description}`,
                    );

                    for (const feeItem of balanceTransaction.fee_details) {
                        gem.addCost(
                            this.dosojin,
                            new BN(feeItem.amount),
                            `fiat_${feeItem.currency}`,
                            `|stripe| Checkout with card (${feeItem.type}): ${feeItem.description}`,
                        );
                    }

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
