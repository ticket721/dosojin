import { instance, mock, reset, spy, when } from 'ts-mockito';
import { Circuit } from '../../core/Circuit';
import { CircuitError } from '../../core/errors/CircuitError';
import { Gem } from '../../core/Gem';

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

        expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);

        when (mockGem.gemStatus).thenReturn('Error');

        expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);

        when (mockGem.gemStatus).thenReturn('Fatal');

        expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);
    });

    test('call dryRunEntitySelection while gem status is not \'Complete\', \'Error\' or \'Fatal\'', async () => {
        const gem: Gem = instance(mockGem);

        const dryRunEntitySelection = spyOn(circuit, 'dryRunEntitySelection');

        circuit.dryRun(gem);

        expect(dryRunEntitySelection).toBeCalledWith(gem);

        setTimeout(() => {
            when (mockGem.gemStatus).thenReturn('Complete');
        }, 500);

        expect(circuit.dryRun(gem)).resolves.toMatchObject(gem);
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

    test('Call run operation once when actionType is operation', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const runOperation = spyOn(circuit, 'dryRunOperation');

        circuit.dryRunEntitySelection(gem);

        expect(runOperation).toBeCalledTimes(1);
    });

    test('Call run transfer once when actionType is transfer', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const runTransfer = spyOn(circuit, 'dryRunTransfer');
        
        circuit.dryRunEntitySelection(gem);

        expect(runTransfer).toBeCalledTimes(1);
    });
}