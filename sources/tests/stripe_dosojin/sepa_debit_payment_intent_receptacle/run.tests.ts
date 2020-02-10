import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { SepaDebitPaymentIntentReceptacle } from '../../../stripe_dosojin';
import { Gem, TransferReceptacleStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';
import BN = require('bn.js');

export function run_tests(): void {
    let sepaDebitPiReceptacle: SepaDebitPaymentIntentReceptacle;
    let piResource: Stripe.PaymentIntentsResource;
    let dosojin: StripeDosojin;

    const mockPiResource: Stripe.PaymentIntentsResource = mock(Stripe.PaymentIntentsResource);
    const mockDosojin: StripeDosojin = mock(StripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockPiResource);
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');
        piResource = instance(mockPiResource);
        dosojin = instance(mockDosojin);

        sepaDebitPiReceptacle = new SepaDebitPaymentIntentReceptacle(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);
        
        when (mockGem.getState(dosojin)).thenReturn(null);

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toThrow();
        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`
        });
    });

    test('throw Error when paymentIntentId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: null
        });

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toThrow();
        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toMatchObject({
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

        when(mockPiResource.retrieve(piId)).thenThrow(new Error('retrieve failed'));

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toThrow();
        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toMatchObject(new Error('retrieve failed'));
    });

    test('throw Error when the payment method of paymentIntent is not a sepa debit', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });

        when(mockDosojin.getStripePiResource()).thenReturn(piResource);

        when(mockPiResource.retrieve(piId)).thenResolve(<any>{
            payment_method_types: [
                'card'
            ]
        });

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toMatchObject(
            new Error('Payment intent with a different payment method than a sepa debit cannot be manage by this Receptacle')
        );
    });

    test('throw Error when paymentIntent status is \'canceled\'', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });

        when(mockDosojin.getStripePiResource()).thenReturn(piResource);

        when(mockPiResource.retrieve(piId)).thenResolve(<any>{
            status: 'canceled',
            payment_method_types: [
                'sepa_debit'
            ]
        });

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(sepaDebitPiReceptacle.run(gem)).rejects.toMatchObject(new Error('Payment intent was canceled'));
    });

    test('Set refreshTimer when payment intent process has not finished yet', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });
        when(mockDosojin.getStripePiResource()).thenReturn(piResource);
        when(mockPiResource.retrieve(piId)).thenResolve(<any>{
            status: 'processing',
            payment_method_types: [
                'sepa_debit'
            ]
        });

        await sepaDebitPiReceptacle.run(gem);

        verify(mockGem.setState(deepEqual(dosojin), deepEqual({ refreshTimer: sepaDebitPiReceptacle.refreshTimer }))).once();
    });

    test('Verify that receptacle status is set to transfer complete when payment intent has succeeded', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';

        const expectedPi = {
            amount: 1000,
            currency: 'eur',
            description: 'desc',
            status: 'succeeded',
            payment_method_types: [
                'sepa_debit'
            ]
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });
        when(mockDosojin.getStripePiResource()).thenReturn(piResource);
        when(mockPiResource.retrieve(piId)).thenResolve(<any>expectedPi);

        await sepaDebitPiReceptacle.run(gem);

        verify(mockGem.addPayloadValue(
            deepEqual(`fiat_${expectedPi.currency}`),
            deepEqual(expectedPi.amount)
        )).once();
        verify(mockGem.addCost(
            deepEqual(dosojin),
            deepEqual(new BN(expectedPi.amount)),
            deepEqual(`fiat_${expectedPi.currency}`),
            deepEqual(`Stripe checkout with sepa debit: ${expectedPi.description}`)
        )).once();

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete)).once();
    });
}
