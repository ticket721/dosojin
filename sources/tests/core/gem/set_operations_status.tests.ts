import { Gem, OperationStatusNames } from '../../../core';

export function set_operations_status_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test("throw error when action type is not 'operation'", () => {
        try {
            expect(gem.setOperationStatus(OperationStatusNames.ReadyForOperation)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setOperationStatus call (transfer instead of operation)',
            });
        }
    });

    test("set layer when action type is 'operation'", () => {
        gem.setActionType('operation');

        const expectedStatus: OperationStatusNames = OperationStatusNames.ReadyForOperation;

        gem.setOperationStatus(expectedStatus);

        expect(gem.operationStatus).toMatchObject({
            status: expectedStatus,
        });
    });
}
