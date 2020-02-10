import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { CardPaymentIntentReceptacle } from '../../../stripe_dosojin';
import { Gem, TransferReceptacleStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';
import BN = require('bn.js');

export function dry_run_tests(): void {
    let cardPiReceptacle: CardPaymentIntentReceptacle;
    let piResource: Stripe.PaymentIntentsResource;
    let dosojin: GenericStripeDosojin;

    const mockPiResource: Stripe.PaymentIntentsResource = mock(Stripe.PaymentIntentsResource);
    const mockDosojin: GenericStripeDosojin = mock(GenericStripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockPiResource);
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');
        piResource = instance(mockPiResource);
        dosojin = instance(mockDosojin);

        cardPiReceptacle = new CardPaymentIntentReceptacle(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);
        
        when (mockGem.getState(dosojin)).thenReturn(null);

        await expect(cardPiReceptacle.dryRun(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.dryRun(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`
        });
    });

    test('throw Error when paymentIntentId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: null
        });

        await expect(cardPiReceptacle.dryRun(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.dryRun(gem)).rejects.toMatchObject({
            message: `gem dosojinName state does not contain any paymentIntentId property`
        });
    });

    test('throw Error when paymentIntent retrieve failed', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });

        when(mockDosojin.getStripePiResource()).thenReturn(piResource);

        when(mockPiResource.retrieve(piId, deepEqual({
            expand: [ 'charges.data.balance_transaction' ]
        }))).thenThrow(new Error('retrieve failed'));

        await expect(cardPiReceptacle.dryRun(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.dryRun(gem)).rejects.toMatchObject(new Error('retrieve failed'));
    });

    test('throw Error when the payment method of paymentIntent is not a card', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });

        when(mockDosojin.getStripePiResource()).thenReturn(piResource);

        when(mockPiResource.retrieve(piId, deepEqual({
            expand: [ 'charges.data.balance_transaction' ]
        }))).thenResolve(<any>{
            payment_method_types: [
                'sepa_debit'
            ]
        });

        await expect(cardPiReceptacle.dryRun(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(cardPiReceptacle.dryRun(gem)).rejects.toMatchObject(
            new Error('Payment intent with a different payment method than a card cannot be manage by this Receptacle')
        );
    });

    test('Verify that receptacle status is set to transfer complete', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';

        const expectedBalanceTx = {
            currency: 'eur',
            fee_details: [
                {
                    amount: 30,
                    currency: 'eur',
                    description: 'Stripe processing fee',
                    type: 'stripe_fee',
                },
                {
                    amount: 10,
                    currency: 'eur',
                    description: 'Application processing fee',
                    type: 'application_fee',
                },
            ],
            net: 960,
        };

        const expectedPi = {
            amount_received: 1000,
            charges: {
                data: [
                    {
                        balance_transaction: expectedBalanceTx
                    }
                ]
            },
            currency: 'eur',
            description: 'desc',
            payment_method_types: [
                'card'
            ]
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });
        when(mockDosojin.getStripePiResource()).thenReturn(piResource);
        when(mockPiResource.retrieve(piId, deepEqual({
            expand: [ 'charges.data.balance_transaction' ]
        }))).thenResolve(<any>expectedPi);

        await cardPiReceptacle.dryRun(gem);

        verify(mockGem.addPayloadValue(
            deepEqual(`fiat_${expectedPi.currency}`),
            deepEqual(expectedPi.amount_received)
        )).once();
        
        verify(mockGem.addCost(
            deepEqual(dosojin),
            deepEqual(new BN(expectedBalanceTx.net)),
            deepEqual(`fiat_${expectedBalanceTx.currency}`),
            deepEqual(`|stripe| Checkout with card (net_amount): ${expectedPi.description}`)
        )).once();

        verify(mockGem.addCost(
            deepEqual(dosojin),
            deepEqual(new BN(expectedBalanceTx.fee_details[0].amount)),
            deepEqual(`fiat_${expectedBalanceTx.fee_details[0].currency}`),
            deepEqual(`|stripe| Checkout with card (${expectedBalanceTx.fee_details[0].type}): ${expectedBalanceTx.fee_details[0].description}`)
        )).once();

        verify(mockGem.addCost(
            deepEqual(dosojin),
            deepEqual(new BN(expectedBalanceTx.fee_details[1].amount)),
            deepEqual(`fiat_${expectedBalanceTx.fee_details[1].currency}`),
            deepEqual(`|stripe| Checkout with card (${expectedBalanceTx.fee_details[1].type}): ${expectedBalanceTx.fee_details[1].description}`)
        )).once();

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete)).once();
    });
}
