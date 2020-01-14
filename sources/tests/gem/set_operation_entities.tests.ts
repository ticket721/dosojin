import BN from 'bn.js';
import { anything, instance, mock, reset, spy, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
} from '../../core';
import {SimpleOperationMock} from '../../mocks/operation/SimpleOperationMock';

export function set_operation_entities_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    let operation: SimpleOperationMock;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({});

        dosojin = instance(mockDosojin);

        operation = new SimpleOperationMock('operation', dosojin);
    });

    test('throw error when action type is not \'operation\'', async () => {
        await expect(gem.setOperationEntities('dosojin', [operation])).rejects.toThrow();
        await expect(gem.setOperationEntities('dosojin', [operation])).rejects.toMatchObject({
            message: 'Invalid actionType for setOperationEntities call (transfer instead of operation)',
        });
    });

    test('throw error when connector scope list is not compatible', async () => {
        gem.setActionType('operation');
        gem.setPayloadValues({'scope': new BN(1)});

        const expectedName: string = 'operation';
        const expectedScopes: string[] = ['invalid_scope'];
        const spiedGem: Gem = spy(gem);
        const spiedOperation: SimpleOperationMock = spy(operation);

        when(spiedGem.checkScopesCompatibility(expectedScopes)).thenReturn(false);

        when(spiedOperation.scopes(gem)).thenResolve(expectedScopes);

        await expect(gem.setOperationEntities('dosojin', [operation])).rejects.toThrow();
        await expect(gem.setOperationEntities('dosojin', [operation])).rejects.toMatchObject({
            message: `Incompatible scopes with operation ${expectedName}: got ${expectedScopes} expected to match ${['scope']}`,
        });
    });

    test('set dosojin name and operation list when scopes are compatible', async () => {
        gem.setActionType('operation');

        const expectedDosojin: string = 'dosojin';
        const expectedName: string = 'operation';
        const spiedGem: Gem = spy(gem);

        when(spiedGem.checkScopesCompatibility(anything())).thenReturn(true);

        await gem.setOperationEntities(expectedDosojin, [operation]);

        expect(gem.operationStatus).toMatchObject({
            dosojin: expectedDosojin,
            operation_list: [expectedName],
        });
    });
}
