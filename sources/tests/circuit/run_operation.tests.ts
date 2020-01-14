import { instance, mock, reset, verify, when} from 'ts-mockito';
import {
    Circuit,
    Gem,
    OperationStatusNames,
    SingleDosojinLayer,
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
} from '../../core';

export function run_operation_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockSdl: SingleDosojinLayer = mock(SingleDosojinLayer);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockSdl);
        reset(mockGem);

        const sdl1: SingleDosojinLayer = instance(mockSdl);
        const sdl2: SingleDosojinLayer = instance(mockSdl);
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName, [sdl1, sdl2]);
    });

    test('throw error when operation status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(circuit.runOperation(gem, false)).rejects.toThrow();
        await expect(circuit.runOperation(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with null operationStatus',
            name: 'CircuitError',
        });
    });

    test('throw error when operation layer is out of layers range', async () => {
        when(mockGem.operationStatus).thenReturn({
            layer: 2,
        });
        const gem: Gem = instance(mockGem);

        await expect(circuit.runOperation(gem, false)).rejects.toThrow();
        await expect(circuit.runOperation(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: `received Gem with invalid Operation Layer index ${gem.operationStatus.layer} (max 1)`,
            name: 'CircuitError',
        });
    });

    test('run layer if operation is not complete', async () => {
        when(mockGem.operationStatus).thenReturn({
            layer: 0,
            status: OperationStatusNames.ReadyForOperation,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runOperation(gem, false);

        verify(mockSdl.run(gem, false)).once();
    });

    test('call nextOperation when operation is complete', async () => {
        when(mockGem.nextOperation()).thenCall(() => {
            when(mockGem.operationStatus).thenReturn({
                operation_list: ['anotherOperation'],
                status: OperationStatusNames.ReadyForOperation,
            });

            return instance(mockGem);
        });

        when(mockGem.operationStatus).thenReturn({
            layer: 0,
            status: OperationStatusNames.OperationComplete,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runOperation(gem, false);

        verify(mockGem.nextOperation()).once();
    });

    test('select connector and set it status when switch to transfer', async () => {
        when(mockSdl.selectConnector(instance(mockGem))).thenResolve(instance(mockGem));

        when(mockGem.nextOperation()).thenCall(() => {
            when(mockGem.operationStatus).thenReturn({
                operation_list: [],
            });

            when(mockGem.actionType).thenReturn('transfer');

            return instance(mockGem);
        });

        when(mockGem.operationStatus).thenReturn({
            layer: 1,
            status: OperationStatusNames.OperationComplete,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runOperation(gem, false);

        verify(mockGem.nextOperation()).once();

        verify(mockSdl.selectConnector(gem)).once();

        verify(mockGem.setConnectorStatus(TransferConnectorStatusNames.ReadyForTransfer)).once();
    });

    test('select connector/receptacle and set status when switch to transfer (with following layer)', async () => {
        when(mockSdl.selectConnector(instance(mockGem))).thenResolve(instance(mockGem));
        when(mockSdl.selectReceptacle(instance(mockGem))).thenResolve(instance(mockGem));

        when(mockGem.nextOperation()).thenCall(() => {
            when(mockGem.operationStatus).thenReturn({
                operation_list: [],
            });

            when(mockGem.actionType).thenReturn('transfer');

            return instance(mockGem);
        });

        when(mockGem.operationStatus).thenReturn({
            layer: 0,
            status: OperationStatusNames.OperationComplete,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runOperation(gem, false);

        verify(mockGem.nextOperation()).once();

        verify(mockSdl.selectConnector(gem)).once();

        verify(mockGem.setConnectorStatus(TransferConnectorStatusNames.ReadyForTransfer)).once();

        verify(mockSdl.selectReceptacle(gem)).once();

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer)).once();
    });
}
