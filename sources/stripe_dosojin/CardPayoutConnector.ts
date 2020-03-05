import { Connector, Gem, TransferConnectorStatusNames } from '../core';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '.';
import { SECOND, MINUTE } from '../core/ActionEntity';
import BN = require('bn.js');

export class CardPayoutConnector extends Connector {
    public dosojin: GenericStripeDosojin;

    constructor(dosojin: GenericStripeDosojin) {
        super('CardPayoutConnector', dosojin);
        this.refreshTimer = 5 * SECOND;
    }

    public async run(gem: Gem): Promise<Gem> {
        const poResource: Stripe.PayoutsResource = this.dosojin.getStripePoResource();

        if (gem.getState(this.dosojin)) {
            if (gem.getState(this.dosojin).payoutId) {
                const poId = gem.getState(this.dosojin).payoutId;

                try {
                    const payout: Stripe.Payout = await poResource.retrieve(poId, {
                        expand: ['balance_transaction'],
                    });

                    if (!(payout.type === 'card')) {
                        return gem.fatal(this.dosojin, 'CardPayoutConnector can manage only bank account Payout');
                    }

                    if (payout.status === 'failed') {
                        return gem.fatal(
                            this.dosojin,
                            `Payout failed for the following reason: ${payout.failure_message} (${payout.failure_code})`,
                        );
                    }

                    if (payout.status === 'canceled') {
                        return gem.fatal(
                            this.dosojin,
                            `Payout was canceled for the following reason: ${payout.failure_message} (${payout.failure_code})`,
                        );
                    }

                    if (payout.status === 'in_transit') {
                        this.refreshTimer = 15 * MINUTE;
                    }

                    if (payout.status === 'paid') {
                        const balanceTransaction: Stripe.BalanceTransaction = payout.balance_transaction as Stripe.BalanceTransaction;
                        gem.addPayloadValue(`fiat_${balanceTransaction.currency}`, balanceTransaction.fee);

                        for (const feeItem of balanceTransaction.fee_details) {
                            gem.addCost(
                                this.dosojin,
                                new BN(feeItem.amount),
                                `fiat_${feeItem.currency}`,
                                `|stripe| Payout with card (${feeItem.type}): ${feeItem.description}`,
                            );
                        }

                        return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
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
                    const payout: Stripe.Payout = await poResource.retrieve(poId, {
                        expand: ['balance_transaction'],
                    });

                    if (!(payout.type === 'card')) {
                        return gem.fatal(this.dosojin, 'CardPayoutConnector can manage only card Payout');
                    }

                    const balanceTransaction: Stripe.BalanceTransaction = payout.balance_transaction as Stripe.BalanceTransaction;
                    gem.addPayloadValue(`fiat_${balanceTransaction.currency}`, balanceTransaction.fee);

                    for (const feeItem of balanceTransaction.fee_details) {
                        gem.addCost(
                            this.dosojin,
                            new BN(feeItem.amount),
                            `fiat_${feeItem.currency}`,
                            `|stripe| Payout with card (${feeItem.type}): ${feeItem.description}`,
                        );
                    }

                    return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
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
        return ['fiat_[a-zA-Z]+'];
    }

    // TODO: implement getConnectorInfo
    public async getConnectorInfo(gem: Gem): Promise<any> {
        return;
    }

    // TODO: implement setReceptacleInfo
    public async setReceptacleInfo(info: any): Promise<void> {
        return;
    }
}
