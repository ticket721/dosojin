import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
} from '../../core';
import { SimpleOperationMock } from '../../mocks/operation/SimpleOperationMock';

export function run_operation_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw dosojin error when operation status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(dosojin.runOperation(gem)).rejects.toThrow();
        await expect(dosojin.runOperation(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: 'received Gem with null operationStatus while on \'operation\' actionType',
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin of gem operation status is invalid', async () => {
        when(mockGem.operationStatus).thenReturn({
            dosojin: 'invalidDosojin',
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runOperation(gem)).rejects.toThrow();
        await expect(dosojin.runOperation(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received invalid Gem with invalid Dosojin name: expected ${dosojinName}, got invalidDosojin`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when operation list is empty', async () => {
        when(mockGem.operationStatus).thenReturn({
            dosojin: dosojinName,
            operation_list: [],
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runOperation(gem)).rejects.toThrow();
        await expect(dosojin.runOperation(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received invalid Gem with no Operations left.`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when the called operation is unexpected', async () => {
        const mockOperation1: SimpleOperationMock = new SimpleOperationMock('operation1', dosojin);
        const mockOperation2: SimpleOperationMock = new SimpleOperationMock('operation2', dosojin);

        dosojin.addOperation(mockOperation2);

        when(mockGem.operationStatus).thenReturn({
            dosojin: dosojinName,
            operation_list: [
                mockOperation1.name,
                mockOperation2.name,
            ],
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runOperation(gem)).rejects.toThrow();
        await expect(dosojin.runOperation(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `unknown Operation ${mockOperation1.name} in Dosojin ${dosojinName}`,
            name: 'DosojinError',
        });
    });

    test('run gem on operation when dosojin contains corresponding operation', async () => {
        const mockOperation1: SimpleOperationMock = new SimpleOperationMock('operation1', dosojin);

        dosojin.addOperation(mockOperation1);

        const spiedOperation: SimpleOperationMock = spy(mockOperation1);

        when(mockGem.operationStatus).thenReturn({
            dosojin: dosojinName,
            operation_list: [
                mockOperation1.name,
            ],
        });

        const gem: Gem = instance(mockGem);

        await dosojin.runOperation(gem);

        verify(spiedOperation.run(gem)).once();
    });
}
