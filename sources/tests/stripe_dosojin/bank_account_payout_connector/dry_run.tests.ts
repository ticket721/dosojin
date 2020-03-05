import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { Gem, TransferConnectorStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';
import { BankAccountPayoutConnector } from '../../../stripe_dosojin';
import BN = require('bn.js');

export function dry_run_tests(): void {
    let bankAccountPoConnector: BankAccountPayoutConnector;
    let poResource: Stripe.PayoutsResource;
    let dosojin: GenericStripeDosojin;

    const mockPoResource: Stripe.PayoutsResource = mock(Stripe.PayoutsResource);
    const mockDosojin: GenericStripeDosojin = mock(GenericStripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockPoResource);
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');
        poResource = instance(mockPoResource);
        dosojin = instance(mockDosojin);

        bankAccountPoConnector = new BankAccountPayoutConnector(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);

        when(mockGem.getState(dosojin)).thenReturn(null);

        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toThrow();
        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`,
        });
    });

    test('throw Error when payoutId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);

        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: null,
        });

        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toThrow();
        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toMatchObject({
            message: `gem dosojinName state does not contain any payoutId property`,
        });
    });

    test('throw Error when payout retrieve failed', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';

        when(mockDosojin.name).thenReturn('dosojinName');

        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId,
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(
            mockPoResource.retrieve(
                poId,
                deepEqual({
                    expand: ['balance_transaction'],
                }),
            ),
        ).thenThrow(new Error('retrieve failed'));

        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toThrow();
        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toMatchObject(new Error('retrieve failed'));
    });

    test('throw Error when the destination of payout is not a bank account', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        const expectedErrorMessage: string = 'BankAccountPayoutConnector can manage only bank account Payout';

        when(mockDosojin.name).thenReturn('dosojinName');

        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId,
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(
            mockPoResource.retrieve(
                poId,
                deepEqual({
                    expand: ['balance_transaction'],
                }),
            ),
        ).thenResolve(<any>{
            type: 'card',
        });

        when(mockGem.errorInfo).thenReturn(<any>{
            message: expectedErrorMessage,
        });

        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toThrow();

        verify(mockGem.fatal(dosojin, expectedErrorMessage)).once();

        await expect(bankAccountPoConnector.dryRun(gem)).rejects.toMatchObject(new Error(expectedErrorMessage));
    });

    test('Verify that connector status is set to transfer complete when payout has succeeded', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        const expectedPo = {
            balance_transaction: {
                currency: 'eur',
                fee: 300,
                fee_details: [
                    {
                        amount: 100,
                        currency: 'eur',
                        description: 'Stripe processing fees',
                        type: 'stripe_fee',
                    },
                    {
                        amount: 200,
                        currency: 'eur',
                        description: 'Application processing fees',
                        type: 'application_fee',
                    },
                ],
            },
            type: 'bank_account',
        };

        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId,
        });
        when(mockDosojin.getStripePoResource()).thenReturn(poResource);
        when(
            mockPoResource.retrieve(
                poId,
                deepEqual({
                    expand: ['balance_transaction'],
                }),
            ),
        ).thenResolve(<any>expectedPo);

        await bankAccountPoConnector.dryRun(gem);

        verify(
            mockGem.addPayloadValue(
                `fiat_${expectedPo.balance_transaction.currency}`,
                expectedPo.balance_transaction.fee,
            ),
        ).once();

        verify(
            mockGem.addCost(
                dosojin,
                deepEqual(new BN(expectedPo.balance_transaction.fee_details[0].amount)),
                `fiat_${expectedPo.balance_transaction.fee_details[0].currency}`,
                `|stripe| Payout with bank account (${expectedPo.balance_transaction.fee_details[0].type}): ${expectedPo.balance_transaction.fee_details[0].description}`,
            ),
        ).once();

        verify(
            mockGem.addCost(
                dosojin,
                deepEqual(new BN(expectedPo.balance_transaction.fee_details[1].amount)),
                `fiat_${expectedPo.balance_transaction.fee_details[1].currency}`,
                `|stripe| Payout with bank account (${expectedPo.balance_transaction.fee_details[1].type}): ${expectedPo.balance_transaction.fee_details[1].description}`,
            ),
        ).once();

        verify(mockGem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete)).once();
    });
}
