import { instance, mock, reset, when, deepEqual } from 'ts-mockito';
import { Stripe } from 'stripe';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';

export function get_stripe_pi_resource_tests(): void {
    let stripeDosojin: GenericStripeDosojin;
    let stripe: Stripe;

    const mockStripe: Stripe = mock(Stripe);

    beforeEach(() => {
        reset(mockStripe);

        stripe = instance(mockStripe);

        stripeDosojin = new GenericStripeDosojin('GenericStripeDosojin', stripe);
    });

    test('return payment intent resource', async () => {
        when(mockStripe.paymentIntents).thenReturn(null);

        expect(stripeDosojin.getStripePiResource()).toEqual(null);
    });
}
