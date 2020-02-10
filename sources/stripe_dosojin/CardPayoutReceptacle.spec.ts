import { run_tests } from '../tests/stripe_dosojin/card_payout_receptacle/run.tests';
import { dry_run_tests } from '../tests/stripe_dosojin/card_payout_receptacle/dry_run.tests';
import { scopes_tests } from '../tests/stripe_dosojin/card_payout_receptacle/scopes.tests';

describe('CardPayoutReceptacle', (): void => {

    describe('run', run_tests);
    describe('dryRun', dry_run_tests);
    describe('scopes', scopes_tests);
});
