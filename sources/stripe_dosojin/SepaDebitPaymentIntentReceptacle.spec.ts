import { run_tests } from '../tests/stripe_dosojin/sepa_debit_payment_intent_receptacle/run.tests';
import { dry_run_tests } from '../tests/stripe_dosojin/sepa_debit_payment_intent_receptacle/dry_run.tests';
import { scopes_tests } from '../tests/stripe_dosojin/sepa_debit_payment_intent_receptacle/scopes.tests';

describe('SepaDebitPaymentIntentReceptacle', (): void => {
    describe('run', run_tests);
    describe('dryRun', dry_run_tests);
    describe('scopes', scopes_tests);
});
