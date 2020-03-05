import { deepEqual, instance, mock, reset, verify, when } from 'ts-mockito';
import {
    Circuit,
    Gem,
    OperationStatusNames,
    SingleDosojinLayer,
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
} from '../../../core';

export function run_transfer_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockSdl: SingleDosojinLayer = mock(SingleDosojinLayer);
    const mockGem: Gem = mock(Gem);
    let sdl1: SingleDosojinLayer;
    let sdl2: SingleDosojinLayer;

    beforeEach(() => {
        reset(mockSdl);
        reset(mockGem);

        sdl1 = instance(mockSdl);
        sdl2 = instance(mockSdl);
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName, [sdl1, sdl2]);
    });

    test('throw error when transfer status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(circuit.runTransfer(gem, false)).rejects.toThrow();
        await expect(circuit.runTransfer(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with null transferStatus',
            name: 'CircuitError',
        });
    });

    test('throw error when connector and receptacle status are null', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: null,
        });

        const gem: Gem = instance(mockGem);

        await expect(circuit.runTransfer(gem, false)).rejects.toThrow();
        await expect(circuit.runTransfer(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: `received Gem with 'transfer' action type, but no Connector or Receptacle found`,
            name: 'CircuitError',
        });
    });

    test('select operations and set operations status to readyForTransfer when transfer is complete', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                status: TransferConnectorStatusNames.TransferComplete,
            },
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: 0,
                status: TransferReceptacleStatusNames.TransferComplete,
            },
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.selectOperations(gem)).thenResolve(instance(mockGem));

        await circuit.runTransfer(gem, false);

        verify(mockGem.setActionType('operation')).once();
        verify(mockSdl.selectOperations(gem)).once();
        verify(mockGem.setOperationStatus(OperationStatusNames.ReadyForOperation)).once();
    });

    test('select operations and set operations status to readyForTransfer when transfer is complete (no connector selected)', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: 0,
                status: TransferReceptacleStatusNames.TransferComplete,
            },
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.selectOperations(gem)).thenResolve(instance(mockGem));

        await circuit.runTransfer(gem, false);

        verify(mockGem.setActionType('operation')).once();
        verify(mockSdl.selectOperations(gem)).once();
        verify(mockGem.setOperationStatus(OperationStatusNames.ReadyForOperation)).once();
    });

    test('set gem status to complete when transfer is complete and no layer/receptacle left', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 1,
                status: TransferConnectorStatusNames.TransferComplete,
            },
            receptacle: null,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runTransfer(gem, false);

        verify(mockGem.setGemStatus('Complete')).once();
    });

    test('call missingReceptacle when receptacle is missing on next layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.TransferComplete,
            },
            receptacle: null,
        });

        const gem: Gem = instance(mockGem);

        await circuit.runTransfer(gem, false);

        verify(mockGem.missingReceptacle()).once();
    });

    test('set connector info to __begin and run gem on layer when no connector on layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 1,
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        });

        const gem: Gem = instance(mockGem);

        await circuit.runTransfer(gem, false);

        verify(mockSdl.getReceptacleInfo(gem)).once();
        verify(mockSdl.setConnectorInfo(gem, deepEqual({ __begin: true }))).once();
        verify(mockSdl.run(gem, false)).once();
    });

    test('throw circuit error when receptacle layer is out of circuit range', async () => {
        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 2,
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(circuit.runTransfer(gem, false)).rejects.toThrow();
        await expect(circuit.runTransfer(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with invalid Receptacle Layer index 2 (max 1)',
            name: 'CircuitError',
        });
    });

    test('throw circuit error when connector layer is out of circuit range', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 2,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(circuit.runTransfer(gem, false)).rejects.toThrow();
        await expect(circuit.runTransfer(gem, false)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with invalid Connector Layer index 2 (max 1)',
            name: 'CircuitError',
        });
    });

    test('set receptacle info to __end and run gem on layer when no receptacle on layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.run(gem, false)).thenResolve(instance(mockGem));

        await circuit.runTransfer(gem, false);

        verify(mockSdl.setReceptacleInfo(gem, deepEqual({ __end: true }))).once();
        verify(mockSdl.run(gem, false)).once();
    });

    test('run gem on layer twice with receptacle and connector infos when both entities are ready for transfer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.run(gem, false)).thenResolve(instance(mockGem));
        when(mockSdl.getReceptacleInfo(gem)).thenResolve(instance(mockGem));
        when(mockSdl.getConnectorInfo(gem)).thenResolve(instance(mockGem));

        await circuit.runTransfer(gem, false);

        verify(mockSdl.getReceptacleInfo(gem)).once();
        verify(mockSdl.setReceptacleInfo(gem, instance(mockGem))).once();
        verify(mockSdl.run(gem, false)).twice();
        verify(mockSdl.getConnectorInfo(gem)).once();
        verify(mockSdl.setConnectorInfo(gem, instance(mockGem))).once();
    });
}
