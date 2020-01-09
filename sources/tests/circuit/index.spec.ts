import { clear_dosojin_tests } from './circuit_cleardosojin.tests';
import { create_gem_tests } from './circuit_creategem.tests';
import { dry_run_tests } from './circuit_dryrun.tests';
import { dry_run_operation_tests } from './circuit_dryrunoperation.tests';
import { dry_run_transfer_tests } from './circuit_dryruntransfer.tests';
import { register_dosojin_tests } from './circuit_registerdosojin.tests';
import { run_tests } from './circuit_run.tests';
import { run_operation_tests } from './circuit_runoperation.tests';
import { run_transfer_tests } from './circuit_runtransfer.tests';

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
