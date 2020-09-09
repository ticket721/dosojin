import { Receptacle, Gem, TransferReceptacleStatusNames } from '../core';
import { Stripe } from 'stripe';
import BN = require('bn.js');
import { GenericStripeDosojin } from '.';
import { MINUTE } from '../core/ActionEntity';

export class SepaDebitPaymentIntentReceptacle extends Receptacle {
    public dosojin: GenericStripeDosojin;

    constructor(dosojin: GenericStripeDosojin) {
        super('SepaPaymentIntentReceptacle', dosojin);
        this.refreshTimer = 15 * MINUTE;
    }

    public async run(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();

        if (gem.getState(this.dosojin)) {
            if (gem.getState(this.dosojin).paymentIntentId) {
                const piId = gem.getState(this.dosojin).paymentIntentId;

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(piId, {
                        expand: ['charges.data.balance_transaction'],
                    });

                    if (!paymentIntent.payment_method_types.includes('sepa_debit')) {
                        return gem.error(
                            this.dosojin,
                            'SepaDebitPaymentIntentReceptacle can manage only sepa debit Payment Intent (Update to a sepa debit payment method or choose an appropriate receptacle)',
                        );
                    }

                    if (paymentIntent.status === 'canceled') {
                        return gem.fatal(
                            this.dosojin,
                            `Payment intent was canceled for the following reason: ${paymentIntent.last_payment_error.message} (${paymentIntent.last_payment_error.code})`,
                        );
                    }

                    if (paymentIntent.status === 'succeeded') {
                        const balanceTransaction: Stripe.BalanceTransaction = paymentIntent.charges.data[0]
                            .balance_transaction as Stripe.BalanceTransaction;

                        gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount_received);

                        gem.addCost(
                            this.dosojin,
                            new BN(balanceTransaction.net),
                            `fiat_${balanceTransaction.currency}`,
                            `|stripe| Checkout with sepa debit (net_amount): ${paymentIntent.description}`,
                        );

                        for (const feeItem of balanceTransaction.fee_details) {
                            gem.addCost(
                                this.dosojin,
                                new BN(feeItem.amount),
                                `fiat_${feeItem.currency}`,
                                `|stripe| Checkout with sepa debit (${feeItem.type}): ${feeItem.description}`,
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
                        expand: ['charges.data.balance_transaction'],
                    });

                    if (!paymentIntent.payment_method_types.includes('sepa_debit')) {
                        return gem.error(
                            this.dosojin,
                            'SepaDebitPaymentIntentReceptacle can manage only sepa debit Payment Intent (Update to a sepa debit payment method or choose an appropriate receptacle)',
                        );
                    }

                    const balanceTransaction: Stripe.BalanceTransaction = paymentIntent.charges.data[0]
                        .balance_transaction as Stripe.BalanceTransaction;

                    gem.addPayloadValue(`fiat_${paymentIntent.currency}`, paymentIntent.amount_received);

                    gem.addCost(
                        this.dosojin,
                        new BN(balanceTransaction.net),
                        `fiat_${balanceTransaction.currency}`,
                        `|stripe| Checkout with sepa debit (net_amount): ${paymentIntent.description}`,
                    );

                    for (const feeItem of balanceTransaction.fee_details) {
                        gem.addCost(
                            this.dosojin,
                            new BN(feeItem.amount),
                            `fiat_${feeItem.currency}`,
                            `|stripe| Checkout with sepa debit (${feeItem.type}): ${feeItem.description}`,
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
        return ['fiat_[a-zA-Z]+'];
    }

    // SepaDebitPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector will ever ask for any informations about SepaDebitPaymentIntentReceptacle
    public async getReceptacleInfo(gem: Gem): Promise<any> {
        return;
    }

    // SepaDebitPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector informations will ever been set by SepaDebitPaymentIntentReceptacle
    public async setConnectorInfo(info: any): Promise<void> {
        return;
    }
}
