import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import {
    Circuit,
    CircuitError,
    Gem
} from '../../core';

export function dry_run_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName);
    });

    test('return modified gem when dry run is called with \'Complete\', \'Error\' or \'Fatal\' gem status', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.gemStatus).thenReturn('Complete');

        await expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);

        when (mockGem.gemStatus).thenReturn('Error');

        await expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);

        when (mockGem.gemStatus).thenReturn('Fatal');

        await expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);
    });

    xtest('call dryRunEntitySelection while gem status is not \'Complete\', \'Error\' or \'Fatal\'', async () => {
        const spiedCircuit = spy(circuit);

        setTimeout(() => {
            when(mockGem.gemStatus).thenReturn('Complete');
        }, 500);

        const gem: Gem = instance(mockGem);

        when(spiedCircuit.dryRunEntitySelection(gem)).thenResolve(instance(mockGem));

        await circuit.dryRun(gem);

        verify(spiedCircuit.dryRunEntitySelection(gem)).called();
    });

    test('throw Circuit error when gem actionType is null', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn(null);

        await expect(circuit.dryRunEntitySelection(gem)).rejects.toThrow();
        await expect(circuit.dryRunEntitySelection(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'CircuitError'
        });
    });

    test('throw Circuit error when run Operation failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const spiedCircuit: Circuit = spy(circuit);

        when(spiedCircuit.dryRunOperation(gem)).thenThrow(new CircuitError(circuitName, `operation failed`));

        await expect(circuit.dryRunEntitySelection(gem)).rejects.toThrow();
        await expect(circuit.dryRunEntitySelection(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'operation failed',
            name: 'CircuitError'
        });
    });

    test('throw Circuit error when run Transfer failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const spiedCircuit: Circuit = spy(circuit);
        when(spiedCircuit.dryRunTransfer(gem)).thenThrow(new CircuitError(circuitName, `transfer failed`));

        await expect(circuit.dryRunEntitySelection(gem)).rejects.toThrow();
        await expect(circuit.dryRunEntitySelection(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'transfer failed',
            name: 'CircuitError'
        });
    });

    test('Call dry run operation once when actionType is operation', async () => {
        const spiedCircuit: Circuit = spy(circuit);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        when(spiedCircuit.dryRunOperation(gem)).thenResolve(instance(mockGem));

        await circuit.dryRunEntitySelection(gem);

        verify(spiedCircuit.dryRunOperation(gem)).once();
    });

    test('Call dry run transfer once when actionType is transfer', async () => {
        const spiedCircuit: Circuit = spy(circuit);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        when(spiedCircuit.dryRunTransfer(gem)).thenResolve(instance(mockGem));

        await circuit.dryRunEntitySelection(gem);

        verify(spiedCircuit.dryRunTransfer(gem)).once();
    });
}