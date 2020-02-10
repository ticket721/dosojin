import { run_tests } from '../tests/stripe_dosojin/card_payout_connector/run.tests';
import { dry_run_tests } from '../tests/stripe_dosojin/card_payout_connector/dry_run.tests';
import { scopes_tests } from '../tests/stripe_dosojin/card_payout_connector/scopes.tests';

describe('CardPayoutConnector', (): void => {

    describe('run', run_tests);
    describe('dryRun', dry_run_tests);
    describe('scopes', scopes_tests);
});
