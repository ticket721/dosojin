import { anyOfClass, instance, mock, reset, verify, when } from 'ts-mockito';
import { Circuit } from '../../core/Circuit';
import { Gem } from '../../core/Gem';
import { SingleDosojinLayer } from '../../core/SingleDosojinLayer';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames } from '../../core/TransferStatus';

export function dry_run_transfer_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockSdl: SingleDosojinLayer = mock(SingleDosojinLayer);
    const mockGem: Gem = mock(Gem);
    let sdl1: SingleDosojinLayer;
    let sdl2: SingleDosojinLayer;

    beforeEach(() => {
        reset(mockSdl);
        reset(mockGem);

        when(mockSdl.selectConnector(anyOfClass(Gem))).thenResolve(instance(mockGem));
        when(mockGem.setConnectorStatus(anyOfClass(Gem))).thenReturn(instance(mockGem));
        when(mockSdl.selectReceptacle(anyOfClass(Gem))).thenResolve(instance(mockGem));
        when(mockGem.setReceptacleStatus(anyOfClass(Gem))).thenReturn(instance(mockGem));

        sdl1 = instance(mockSdl);
        sdl2 = instance(mockSdl);
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName, [sdl1, sdl2]);
    });

    test('throw error when transfer status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(circuit.dryRunTransfer(gem)).rejects.toThrow();
        await expect(circuit.dryRunTransfer(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with null transferStatus',
            name: 'CircuitError'
        });
    });

    test('throw error when connector and receptacle status are null', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: null
        });
        const gem: Gem = instance(mockGem);

        await expect(circuit.dryRunTransfer(gem)).rejects.toThrow();
        await expect(circuit.dryRunTransfer(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: `received Gem with 'transfer' action type, but no Connector or Receptacle found`,
            name: 'CircuitError'
        });
    });

    test('set operations and set operations status when transfer is complete', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                status: TransferConnectorStatusNames.TransferComplete
            },
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: 0,
                status: TransferReceptacleStatusNames.TransferComplete
            }
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.selectOperations(gem)).thenResolve(instance(mockGem));

        const selectOperations = spyOn(sdl1, 'selectOperations');
        // const setOperationStatus = spyOn(gem, 'setOperationStatus');

        circuit.dryRunTransfer(gem);

        verify(mockGem.setActionType('operation')).once();
        expect(selectOperations).toBeCalledTimes(1);
        // gem should not be undefined 

        // expect(setOperationStatus).toHaveBeenCalledTimes(1);
    });

    test('select operations and set operations status when transfer is complete (no connector selected)', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                status: TransferReceptacleStatusNames.TransferComplete
            }
        });

        const gem: Gem = instance(mockGem);

        when(mockSdl.selectOperations(gem)).thenResolve(instance(mockGem));

        // const setOperationStatus = spyOn(gem, 'setOperationStatus');

        circuit.dryRunTransfer(gem);

        verify(mockGem.setActionType('operation')).once();
        // verify(mockSdl.selectOperations(gem)).once();
        // gem should not be undefined 

        // expect(setOperationStatus).toHaveBeenCalledTimes(1);
    });

    test('set gem status to complete when transfer is complete and no layer and receptacle left', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 1,
                status: TransferConnectorStatusNames.TransferComplete
            },
            receptacle: null
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        verify(mockGem.setGemStatus('Complete')).once();
    });

    test('call missingReceptacle when receptacle is missing on next layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.TransferComplete
            },
            receptacle: null
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        verify(mockGem.missingReceptacle()).once();
    });

    test('set connector info to __begin and run gem on layer when no connector on layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 1,
                status: TransferReceptacleStatusNames.ReadyForTransfer
            }
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        verify(mockSdl.getReceptacleInfo(gem)).once();
        // verify(mockSdl.setConnectorInfo(gem, {__begin: true})).once();
        // verify(mockSdl.dryRun(gem)).once();
    });

    test('throw circuit error when receptacle layer is out of circuit range', async () => {
        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 2,
                status: TransferReceptacleStatusNames.ReadyForTransfer
            }
        });

        const gem: Gem = instance(mockGem);

        await expect(circuit.dryRunTransfer(gem)).rejects.toThrow();
        await expect(circuit.dryRunTransfer(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with invalid Receptacle Layer index 2 (max 1)',
            name: 'CircuitError'
        });
    });

    test('throw circuit error when connector layer is out of circuit range', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 2,
                status: TransferConnectorStatusNames.ReadyForTransfer
            },
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        await expect(circuit.dryRunTransfer(gem)).rejects.toThrow();
        await expect(circuit.dryRunTransfer(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'received Gem with invalid Connector Layer index 2 (max 1)',
            name: 'CircuitError'
        });
    });

    test('set receptacle info to __end and run gem on layer when no receptacle on layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.ReadyForTransfer
            }
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        /* Verify calls :
          - setReceptacleInfo once
          - layer.dyrRun once
        */
    });

    test('', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferConnectorStatusNames.ReadyForTransfer
            },
            receptacle: {
                ...mockGem.transferStatus.connector,
                layer: 0,
                status: TransferReceptacleStatusNames.ReadyForTransfer
            }
        });

        const gem: Gem = instance(mockGem);

        circuit.dryRunTransfer(gem);

        /* Verify calls :
          - getReceptacleInfo
          - setReceptacleInfo once
          - layer.dryRun twice
          - getConnectorInfo once
          - setConnectorInfo once
        */
    });
}