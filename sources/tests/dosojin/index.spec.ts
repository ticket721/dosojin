import {get_connector_info_tests} from './get_connector_info.tests';
import {get_receptacle_info_tests} from './get_receptacle_info.tests';
import { run_tests } from './run.tests';
import {run_operation_tests} from './run_operation.tests';
import { run_transfer_tests} from './run_transfer.tests';
import {select_connector_tests} from './select_connector.tests';
import {select_operations_tests} from './select_operations.tests';
import {select_receptacle_tests} from './select_receptacle.tests';
import {set_connector_info_tests} from './set_connector_info.tests';
import {set_receptacle_info_tests} from './set_receptacle_info.tests';

describe('Dosojin', (): void => {

    describe('run', run_tests);
    describe('runOperation', run_operation_tests);
    describe('runTransfer', run_transfer_tests);
    describe('getReceptacleInfo', get_receptacle_info_tests);
    describe('setReceptacleInfo', set_receptacle_info_tests);
    describe('getConnectorInfo', get_connector_info_tests);
    describe('setConnectorInfo', set_connector_info_tests);
    describe('selectConnector', select_connector_tests);
    describe('selectReceptacle', select_receptacle_tests);
    describe('selectOperations', select_operations_tests);
});
