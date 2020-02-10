import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { Gem, TransferReceptacleStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';
import { CardPayoutReceptacle } from '../../../stripe_dosojin';
import { MINUTE } from '../../../core/ActionEntity';

export function run_tests(): void {
    let cardPoReceptacle: CardPayoutReceptacle;
    let poResource: Stripe.PayoutsResource;
    let dosojin: StripeDosojin;

    const mockPoResource: Stripe.PayoutsResource = mock(Stripe.PayoutsResource);
    const mockDosojin: StripeDosojin = mock(StripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockPoResource);
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');
        poResource = instance(mockPoResource);
        dosojin = instance(mockDosojin);

        cardPoReceptacle = new CardPayoutReceptacle(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);
        
        when (mockGem.getState(dosojin)).thenReturn(null);

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`
        });
    });

    test('throw Error when payoutId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: null
        });

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject({
            message: `gem dosojinName state does not contain any payoutId property`
        });
    });

    test('throw Error when payout retrieve failed', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenThrow(new Error('retrieve failed'));

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();
        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject(new Error('retrieve failed'));
    });

    test('throw Error when the destination of payout is not a card', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>{
            type: 'bank_account'
        });

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject(
            new Error('This Receptacle can manage only card Payout')
        );
    });

    test('throw Error when payout status is \'failed\'', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        const expectedPo = {
            failure_code: 'mockFailureCode',
            failure_message: 'mock failure message',
            status: 'failed',
            type: 'card'
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>expectedPo);

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject(
            new Error(`Payout failed for the following reason: ${expectedPo.failure_message} (${expectedPo.failure_code})`)
        );
    });

    test('throw Error when payout status is \'canceled\'', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        const expectedPo = {
            failure_code: 'mockFailureCode',
            failure_message: 'mock failure message',
            status: 'canceled',
            type: 'card'
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>expectedPo);

        await expect(cardPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(cardPoReceptacle.run(gem)).rejects.toMatchObject(
            new Error(`Payout was canceled for the following reason: ${expectedPo.failure_message} (${expectedPo.failure_code})`)
        );
    });

    test('Increase refreshTimer when payout is in transit', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });
        when(mockDosojin.getStripePoResource()).thenReturn(poResource);
        when(mockPoResource.retrieve(poId)).thenResolve(<any>{
            status: 'in_transit',
            type: 'card'
        });

        await cardPoReceptacle.run(gem);

        expect(cardPoReceptacle.refreshTimer).toEqual(15 * MINUTE);

        verify(mockGem.setState(deepEqual(dosojin), deepEqual({ refreshTimer: cardPoReceptacle.refreshTimer }))).once();
    });

    test('Verify that receptacle status is set to transfer complete when payout has succeeded', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });
        when(mockDosojin.getStripePoResource()).thenReturn(poResource);
        when(mockPoResource.retrieve(poId)).thenResolve(<any>{
            status: 'paid',
            type: 'card'
        });

        await cardPoReceptacle.run(gem);

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete)).once();
    });
}
