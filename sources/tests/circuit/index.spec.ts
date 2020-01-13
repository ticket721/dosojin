import { clear_dosojin_tests } from './clear_dosojin.tests';
import { create_gem_tests } from './create_gem.tests';
import { dry_run_tests } from './dry_run.tests';
import { dry_run_operation_tests } from './dry_run_operation.tests';
import { dry_run_transfer_tests } from './dry_run_transfer.tests';
import { register_dosojin_tests } from './register_dosojin.tests';
import { run_tests } from './run.tests';
import { run_operation_tests } from './run_operation.tests';
import { run_transfer_tests } from './run_transfer.tests';

describe('Circuit', (): void => {

    describe('createGem', create_gem_tests);
    describe('run', run_tests);
    describe('runOperation', run_operation_tests);
    describe('runTransfer', run_transfer_tests);
    describe('dryRun', dry_run_tests);
    describe('dryRunOperation', dry_run_operation_tests);
    describe('dryRunTransfer', dry_run_transfer_tests);
    describe('registerDosojin', register_dosojin_tests);
    describe('clearDosojin', clear_dosojin_tests);
});
