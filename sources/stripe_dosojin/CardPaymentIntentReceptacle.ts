import { Receptacle, Gem, TransferReceptacleStatusNames } from '../core';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '.';
import { SECOND } from '../core/ActionEntity';
import get from 'lodash.get';

export interface PaymentRegionRestrictions {
    [key: string]: {
        variable_fee: number;
        fix_fee: number;
    };
}

export interface PaymentMethodRestrictions {
    [key: string]: {
        country_resolution_path: string;
    };
}

export class CardPaymentIntentReceptacle extends Receptacle {
    public dosojin: GenericStripeDosojin;

    constructor(dosojin: GenericStripeDosojin) {
        super('CardPaymentIntentReceptacle', dosojin);
        this.refreshTimer = 5 * SECOND;
    }

    private validateCurrency(paymentIntent: Stripe.PaymentIntent, currency: string): boolean {
        return paymentIntent.currency === currency;
    }

    private validatePaymentMethod(
        paymentIntent: Stripe.PaymentIntent,
        restrictions: PaymentMethodRestrictions,
    ): boolean {
        const paymentMethodDetails: Stripe.Charge.PaymentMethodDetails =
            paymentIntent.charges.data[0].payment_method_details;
        const paymentMethodType = paymentMethodDetails.type;

        return restrictions[paymentMethodType] !== undefined;
    }

    private validateRegion(
        paymentIntent: Stripe.PaymentIntent,
        regionRestrictions: PaymentRegionRestrictions,
        methodsRestrictions: PaymentMethodRestrictions,
    ): boolean {
        const paymentMethodDetails: Stripe.Charge.PaymentMethodDetails =
            paymentIntent.charges.data[0].payment_method_details;
        const paymentMethodType = paymentMethodDetails.type;

        const country = get(
            (paymentMethodDetails as any)[paymentMethodType],
            methodsRestrictions[paymentMethodType].country_resolution_path,
        );

        return regionRestrictions[country] !== undefined;
    }

    private getAmountToCapture(
        paymentIntent: Stripe.PaymentIntent,
        net: number,
        regionRestrictions: PaymentRegionRestrictions,
        methodsRestrictions: PaymentMethodRestrictions,
    ): number {
        const paymentMethodDetails: Stripe.Charge.PaymentMethodDetails =
            paymentIntent.charges.data[0].payment_method_details;
        const paymentMethodType = paymentMethodDetails.type;

        const country = get(
            (paymentMethodDetails as any)[paymentMethodType],
            methodsRestrictions[paymentMethodType].country_resolution_path,
        );

        const { variable_fee, fix_fee } = regionRestrictions[country];

        const amount = paymentIntent.amount_capturable;
        const amountFee = Math.round(amount * (variable_fee / 100)) + fix_fee;

        if (amount - amountFee < net) {
            return (amount - amountFee) - net;
        }

        if (amount - amountFee === net) {
            return amount;
        }

        return amount - Math.round((amount - amountFee - net) / (1 - variable_fee / 100));
    }

    private getAmountToRefund(
        paymentIntent: Stripe.PaymentIntent,
        regionRestrictions: PaymentRegionRestrictions,
        methodsRestrictions: PaymentMethodRestrictions,
    ): number {
        const paymentMethodDetails: Stripe.Charge.PaymentMethodDetails =
            paymentIntent.charges.data[0].payment_method_details;
        const paymentMethodType = paymentMethodDetails.type;

        const country = get(
            (paymentMethodDetails as any)[paymentMethodType],
            methodsRestrictions[paymentMethodType].country_resolution_path,
        );

        const { variable_fee, fix_fee } = regionRestrictions[country];

        const receivedAmount = this.getReceivedAmount(paymentIntent, regionRestrictions, methodsRestrictions);

        return receivedAmount - Math.ceil(receivedAmount * (variable_fee / 100) + fix_fee);
    }

    private getReceivedAmount(
        paymentIntent: Stripe.PaymentIntent,
        regionRestrictions: PaymentRegionRestrictions,
        methodsRestrictions: PaymentMethodRestrictions,
    ): number {
        const paymentMethodDetails: Stripe.Charge.PaymentMethodDetails =
            paymentIntent.charges.data[0].payment_method_details;
        const paymentMethodType = paymentMethodDetails.type;

        const country = get(
            (paymentMethodDetails as any)[paymentMethodType],
            methodsRestrictions[paymentMethodType].country_resolution_path,
        );

        const { variable_fee, fix_fee } = regionRestrictions[country];

        return (
            paymentIntent.amount_received - Math.round(paymentIntent.amount_received * (variable_fee / 100) + fix_fee)
        );
    }

    private verifyArguments(state: any): boolean {
        return (
            state.paymentIntentId &&
            state.currency &&
            state.amount &&
            state.regionRestrictions &&
            state.methodsRestrictions
        );
    }

    public async run(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();
        const reResource: Stripe.RefundsResource = this.dosojin.getStripeReResource();

        if (gem.getState(this.dosojin)) {
            if (this.verifyArguments(gem.getState(this.dosojin))) {
                const {
                    paymentIntentId,
                    currency,
                    amount,
                    regionRestrictions,
                    methodsRestrictions,
                }: {
                    paymentIntentId: string;
                    currency: string;
                    amount: number;
                    regionRestrictions: PaymentRegionRestrictions;
                    methodsRestrictions: PaymentMethodRestrictions;
                } = gem.getState(this.dosojin);

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(paymentIntentId, {
                        expand: ['charges.data.balance_transaction', 'charges.data.payment_method_details'],
                    });

                    if (!paymentIntent.payment_method_types.includes('card')) {
                        return gem.error(
                            this.dosojin,
                            'CardPaymentIntentReceptacle can manage only card Payment Intent (Update to a card payment method or choose an appropriate receptacle)',
                        );
                    }

                    if (paymentIntent.status === 'canceled') {
                        return gem.fatal(
                            this.dosojin,
                            `Payment intent was canceled for the following reason: ${paymentIntent.last_payment_error.message} (${paymentIntent.last_payment_error.code})`,
                        );
                    }

                    if (paymentIntent.status === 'requires_capture') {
                        if (!this.validateCurrency(paymentIntent, currency)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported currency: ${paymentIntent.currency}`,
                            );
                        }

                        if (!this.validatePaymentMethod(paymentIntent, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported Payment Method: ${
                                    (paymentIntent.charges.data[0]
                                        .payment_method_details as Stripe.Charge.PaymentMethodDetails).type
                                }`,
                            );
                        }

                        if (!this.validateRegion(paymentIntent, regionRestrictions, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected because Payment Intents was emitted from unsupported region.`,
                            );
                        }

                        const amountToCapture = this.getAmountToCapture(
                            paymentIntent,
                            amount,
                            regionRestrictions,
                            methodsRestrictions,
                        );

                        if (amountToCapture < 0) {

                            await piResource.cancel(paymentIntent.id)

                            return gem.fatal(this.dosojin, `Payment Intent's capturable amount is too low.`);
                        }

                        await piResource.capture(paymentIntent.id, {
                            amount_to_capture: amountToCapture,
                        });
                    }

                    if (paymentIntent.status === 'succeeded') {
                        if (!this.validateCurrency(paymentIntent, currency)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported currency: ${paymentIntent.currency}`,
                            );
                        }

                        if (!this.validatePaymentMethod(paymentIntent, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported Payment Method: ${
                                    (paymentIntent.charges.data[0]
                                        .payment_method_details as Stripe.Charge.PaymentMethodDetails).type
                                }`,
                            );
                        }

                        if (!this.validateRegion(paymentIntent, regionRestrictions, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected because Payment Intents was emitted from unsupported region.`,
                            );
                        }

                        const receivedAmount = this.getReceivedAmount(
                            paymentIntent,
                            regionRestrictions,
                            methodsRestrictions,
                        );

                        if (receivedAmount !== amount) {
                            const amountToRefund = this.getAmountToRefund(
                                paymentIntent,
                                regionRestrictions,
                                methodsRestrictions,
                            );

                            await reResource.create({
                                payment_intent: paymentIntent.id,
                                amount: amountToRefund,
                            });

                            return gem.fatal(this.dosojin, `Invalid Succeeded Payment Intent. Got Refunded.`);
                        }

                        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
                    }

                    gem.setState(this.dosojin, { refreshTimer: this.refreshTimer });

                    return gem;
                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain all required properties`);
            }
        } else {
            throw new Error(`gem state does not contain a ${this.dosojin.name} Dosojin property`);
        }
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        const piResource: Stripe.PaymentIntentsResource = this.dosojin.getStripePiResource();

        if (gem.getState(this.dosojin)) {
            if (this.verifyArguments(gem.getState(this.dosojin))) {
                const {
                    paymentIntentId,
                    currency,
                    amount,
                    regionRestrictions,
                    methodsRestrictions,
                }: {
                    paymentIntentId: string;
                    currency: string;
                    amount: number;
                    regionRestrictions: PaymentRegionRestrictions;
                    methodsRestrictions: PaymentMethodRestrictions;
                } = gem.getState(this.dosojin);

                try {
                    const paymentIntent: Stripe.PaymentIntent = await piResource.retrieve(paymentIntentId, {
                        expand: ['charges.data.balance_transaction', 'charges.data.payment_method_details'],
                    });

                    if (!paymentIntent.payment_method_types.includes('card')) {
                        return gem.error(
                            this.dosojin,
                            'CardPaymentIntentReceptacle can manage only card Payment Intent (Update to a card payment method or choose an appropriate receptacle)',
                        );
                    }

                    if (paymentIntent.status === 'canceled') {
                        return gem.fatal(
                            this.dosojin,
                            `Payment intent was canceled for the following reason: ${paymentIntent.last_payment_error.message} (${paymentIntent.last_payment_error.code})`,
                        );
                    }

                    if (paymentIntent.status === 'requires_capture') {
                        if (!this.validateCurrency(paymentIntent, currency)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported currency: ${paymentIntent.currency}`,
                            );
                        }

                        if (!this.validatePaymentMethod(paymentIntent, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported Payment Method: ${
                                    (paymentIntent.charges.data[0]
                                        .payment_method_details as Stripe.Charge.PaymentMethodDetails).type
                                }`,
                            );
                        }

                        if (!this.validateRegion(paymentIntent, regionRestrictions, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected because Payment Intents was emitted from unsupported region.`,
                            );
                        }

                        const amountToCapture = this.getAmountToCapture(
                            paymentIntent,
                            amount,
                            regionRestrictions,
                            methodsRestrictions,
                        );

                        if (amountToCapture < 0) {
                            return gem.fatal(this.dosojin, `Payment Intent's capturable amount is too low.`);
                        }
                    }

                    if (paymentIntent.status === 'succeeded') {
                        if (!this.validateCurrency(paymentIntent, currency)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported currency: ${paymentIntent.currency}`,
                            );
                        }

                        if (!this.validatePaymentMethod(paymentIntent, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected for an unsupported Payment Method: ${
                                    (paymentIntent.charges.data[0]
                                        .payment_method_details as Stripe.Charge.PaymentMethodDetails).type
                                }`,
                            );
                        }

                        if (!this.validateRegion(paymentIntent, regionRestrictions, methodsRestrictions)) {
                            return gem.fatal(
                                this.dosojin,
                                `Payment intent was rejected because Payment Intents was emitted from unsupported region.`,
                            );
                        }

                        const receivedAmount = this.getReceivedAmount(
                            paymentIntent,
                            regionRestrictions,
                            methodsRestrictions,
                        );

                        if (receivedAmount !== amount) {
                            return gem.fatal(this.dosojin, `Invalid Succeeded Payment Intent. Got Refunded.`);
                        }

                        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
                    }

                    gem.setState(this.dosojin, { refreshTimer: this.refreshTimer });

                    return gem;
                } catch (e) {
                    throw e;
                }
            } else {
                throw new Error(`gem ${this.dosojin.name} state does not contain all required properties`);
            }
        } else {
            throw new Error(`gem state does not contain a ${this.dosojin.name} Dosojin property`);
        }
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_[a-zA-Z]+'];
    }

    // CardPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector will ever ask for any informations about CardPaymentIntentReceptacle
    public async getReceptacleInfo(gem: Gem): Promise<any> {
        return;
    }

    // CardPaymentIntentReceptacle can only be present at the very beginning of Circuit
    // Therefore no Connector informations will ever been set by CardPaymentIntentReceptacle
    public async setConnectorInfo(info: any): Promise<void> {
        return;
    }
}
