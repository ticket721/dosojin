import {
    Gem,
    OperationStatusNames,
} from '../../core';

export function next_operation_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('throw error when action type is not operation', () => {
        try {
            expect(gem.nextOperation()).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for nextOperation call (transfer instead of operation)',
            });
        }
    });

    test('throw error when operation status is not set', () => {
        gem.setActionType('operation');

        try {
            expect(gem.nextOperation()).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid nextOperation call with null operationStatus',
            });
        }
    });

    test('slice operation list and status when operation list contains more than one operation', () => {
        gem.setActionType('operation');

        gem.operationStatus = {
            dosojin: 'dosojin',
            layer: 0,
            operation_list: [
                'op_1',
                'op_2',
            ],
            status: OperationStatusNames.OperationComplete,
        };

        gem.nextOperation();

        expect(gem.operationStatus).toMatchObject({
            operation_list: [
                'op_2',
            ],
            status: OperationStatusNames.ReadyForOperation,
        });
    });

    test('set operation status to null switch action type to transfer when there is no operation left', () => {
        gem.setActionType('operation');

        gem.operationStatus = {
            dosojin: 'dosojin',
            layer: 0,
            operation_list: [
                'op_1',
            ],
            status: OperationStatusNames.OperationComplete,
        };

        gem.nextOperation();

        expect(gem.operationStatus).toBeNull();
        expect(gem.actionType).toEqual('transfer');
    });
}
