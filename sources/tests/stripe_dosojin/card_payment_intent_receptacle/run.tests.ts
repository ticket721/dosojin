import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { CardPaymentIntentReceptacle } from '../../../stripe_dosojin';
import { Gem, TransferReceptacleStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';
import BN = require('bn.js');

export function run_tests(): void {
    let cardPiReceptacle: CardPaymentIntentReceptacle;
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

        cardPiReceptacle = new CardPaymentIntentReceptacle(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);
        
        when (mockGem.getState(dosojin)).thenReturn(null);

        await expect(cardPiReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.run(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`
        });
    });

    test('throw Error when paymentIntentId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: null
        });

        await expect(cardPiReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.run(gem)).rejects.toMatchObject({
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

        await expect(cardPiReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPiReceptacle.run(gem)).rejects.toMatchObject(new Error('retrieve failed'));
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
            status: 'canceled'
        });

        await expect(cardPiReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(cardPiReceptacle.run(gem)).rejects.toMatchObject(new Error('Payment intent was canceled'));
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
            status: 'processing'
        });

        await cardPiReceptacle.run(gem);

        verify(mockGem.setState(deepEqual(dosojin), deepEqual({ refreshTimer: cardPiReceptacle.refreshTimer }))).once();
    });

    test('Verify that receptacle status is set to transfer complete when payment intent has succeeded', async () => {
        const gem: Gem = instance(mockGem);
        const piId: string = 'pi_mockId';

        const expectedPi = {
            amount: 1000,
            currency: 'eur',
            description: 'desc',
            status: 'succeeded'
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            paymentIntentId: piId
        });
        when(mockDosojin.getStripePiResource()).thenReturn(piResource);
        when(mockPiResource.retrieve(piId)).thenResolve(<any>expectedPi);

        await cardPiReceptacle.run(gem);

        verify(mockGem.addPayloadValue(
            deepEqual(`fiat_${expectedPi.currency}`),
            deepEqual(expectedPi.amount)
        )).once();
        verify(mockGem.addCost(
            deepEqual(dosojin),
            deepEqual(new BN(expectedPi.amount)),
            deepEqual(`fiat_${expectedPi.currency}`),
            deepEqual(`Stripe checkout with card: ${expectedPi.description}`)
        )).once();

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete)).once();
    });
}
