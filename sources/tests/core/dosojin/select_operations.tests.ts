import { instance, mock, reset, verify } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    Operation,
} from '../../../core';

export function select_operations_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockOperation: Operation = mock(Operation);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('set operation entities on gem (default behavior)', async () => {
        const operation: Operation = instance(mockOperation);

        dosojin.addOperation(operation);
        dosojin.addOperation(operation);

        const gem: Gem = instance(mockGem);

        await dosojin.selectOperations(gem);

        verify(mockGem.setOperationEntities(dosojinName, [instance(mockOperation), instance(mockOperation)]));
    });
}
