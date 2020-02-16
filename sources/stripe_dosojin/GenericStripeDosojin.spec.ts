import { get_stripe_pi_resource_tests } from '../tests/stripe_dosojin/generic_stripe_dosojin/get_stripe_pi_resource.tests';
import { get_stripe_po_resource_tests } from '../tests/stripe_dosojin/generic_stripe_dosojin/get_stripe_po_resource.tests';

describe('GenericStripeDosojin', (): void => {

    describe('getStripePiResource', get_stripe_pi_resource_tests);
    describe('getStripePoResource', get_stripe_po_resource_tests);
});
