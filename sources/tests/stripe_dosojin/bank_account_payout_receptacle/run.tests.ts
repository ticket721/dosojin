import { instance, mock, reset, when, verify, deepEqual } from 'ts-mockito';
import { Gem, TransferReceptacleStatusNames } from '../../../core';
import { Stripe } from 'stripe';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';
import { BankAccountPayoutReceptacle } from '../../../stripe_dosojin';
import { MINUTE } from '../../../core/ActionEntity';

export function run_tests(): void {
    let bankAccountPoReceptacle: BankAccountPayoutReceptacle;
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

        bankAccountPoReceptacle = new BankAccountPayoutReceptacle(dosojin);
    });

    test('throw Error when dosojin state does not exist on gem', async () => {
        const gem: Gem = instance(mockGem);
        
        when (mockGem.getState(dosojin)).thenReturn(null);

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();
        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject({
            message: `gem state does not contain a dosojinName Dosojin property`
        });
    });

    test('throw Error when payoutId does not exist on dosojin state', async () => {
        const gem: Gem = instance(mockGem);
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: null
        });

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();
        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject({
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

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();
        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject(new Error('retrieve failed'));
    });

    test('throw Error when the destination of payout is not a bank account', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>{
            type: 'card'
        });

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject(
            new Error('This Receptacle can manage only bank account Payout')
        );
    });

    test('throw Error when payout status is \'failed\'', async () => {
        const gem: Gem = instance(mockGem);
        const poId: string = 'po_mockId';
        const expectedPo = {
            failure_code: 'mockFailureCode',
            failure_message: 'mock failure message',
            status: 'failed',
            type: 'bank_account'
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>expectedPo);

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject(
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
            type: 'bank_account'
        }
        
        when(mockDosojin.name).thenReturn('dosojinName');
        
        when(mockGem.getState<any>(dosojin)).thenReturn({
            payoutId: poId
        });

        when(mockDosojin.getStripePoResource()).thenReturn(poResource);

        when(mockPoResource.retrieve(poId)).thenResolve(<any>expectedPo);

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toThrow();

        verify(mockGem.setGemStatus('Error')).once();

        await expect(bankAccountPoReceptacle.run(gem)).rejects.toMatchObject(
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
            type: 'bank_account'
        });

        await bankAccountPoReceptacle.run(gem);

        expect(bankAccountPoReceptacle.refreshTimer).toEqual(15 * MINUTE);

        verify(mockGem.setState(deepEqual(dosojin), deepEqual({ refreshTimer: bankAccountPoReceptacle.refreshTimer }))).once();
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
            type: 'bank_account'
        });

        await bankAccountPoReceptacle.run(gem);

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete)).once();
    });
}
