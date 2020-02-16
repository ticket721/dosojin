import { instance, mock, reset, when, deepEqual } from 'ts-mockito';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';

export function get_stripe_po_resource_tests(): void {
    let stripeDosojin: GenericStripeDosojin;
    let stripe: Stripe;

    const mockStripe: Stripe = mock(Stripe);

    beforeEach(() => {
        reset(mockStripe);

        stripe = instance(mockStripe);

        stripeDosojin = new GenericStripeDosojin('GenericStripeDosojin', stripe);
    });

    test('return payout resource', async () => {
        when(mockStripe.payouts).thenReturn(null);

        expect(stripeDosojin.getStripePoResource()).toEqual(null);
    });
}
