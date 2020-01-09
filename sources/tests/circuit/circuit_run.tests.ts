import { instance, mock, reset, spy, when } from 'ts-mockito';
import { Circuit } from '../../core/Circuit';
import { CircuitError } from '../../core/errors/CircuitError';
import { Gem } from '../../core/Gem';

export function run_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName);
    });

    test('throw Circuit error when gem actionType is null', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn(null);

        await expect(circuit.run(gem)).rejects.toThrow();
        await expect(circuit.run(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'CircuitError'
        });
    });

    test('throw Circuit error when run Operation failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const spiedCircuit: Circuit = spy(circuit);

        when(spiedCircuit.runOperation(gem)).thenThrow(new CircuitError(circuitName, `operation failed`));

        await expect(circuit.run(gem)).rejects.toThrow();
        await expect(circuit.run(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'operation failed',
            name: 'CircuitError'
        });
    });

    test('throw Circuit error when run Transfer failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const spiedCircuit: Circuit = spy(circuit);
        when(spiedCircuit.runTransfer(gem)).thenThrow(new CircuitError(circuitName, `transfer failed`));

        await expect(circuit.run(gem)).rejects.toThrow();
        await expect(circuit.run(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'transfer failed',
            name: 'CircuitError'
        });
    });

    test('Call run operation once when actionType is operation', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const runOperation = spyOn(circuit, 'runOperation');

        circuit.run(gem);

        expect(runOperation).toBeCalledTimes(1);
    });

    test('Call run transfer once when actionType is transfer', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const runTransfer = spyOn(circuit, 'runTransfer');
        
        circuit.run(gem);

        expect(runTransfer).toBeCalledTimes(1);
    });
}