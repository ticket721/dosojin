import { clear_dosojin_tests } from '../tests/core/circuit/clear_dosojin.tests';
import { create_gem_tests } from '../tests/core/circuit/create_gem.tests';
import { dry_run_tests } from '../tests/core/circuit/dry_run.tests';
import { register_dosojin_tests } from '../tests/core/circuit/register_dosojin.tests';
import { run_tests } from '../tests/core/circuit/run.tests';
import { run_operation_tests } from '../tests/core/circuit/run_operation.tests';
import { run_transfer_tests } from '../tests/core/circuit/run_transfer.tests';

describe('Circuit', (): void => {

    describe('createGem', create_gem_tests);
    describe('run', run_tests);
    describe('runOperation', run_operation_tests);
    describe('runTransfer', run_transfer_tests);
    describe('dryRun', dry_run_tests);
    describe('registerDosojin', register_dosojin_tests);
    describe('clearDosojin', clear_dosojin_tests);
});
