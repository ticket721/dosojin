import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import {
    Circuit,
    Gem,
} from '../../core';
import {CompleteGemMock} from '../../mocks/gem/CompleteGemMock';

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

    test('call run with dry = true while gem status is not \'Complete\', \'Error\' or \'Fatal\'', async () => {
        const spiedCircuit = spy(circuit);

        const gem: Gem = instance(mockGem);

        when(spiedCircuit.run(gem, true)).thenResolve(new CompleteGemMock());

        await circuit.dryRun(gem);

        verify(spiedCircuit.run(gem, true)).once();
    });
}
