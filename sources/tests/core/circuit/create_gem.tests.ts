import {instance, mock, reset, verify, when} from 'ts-mockito';
import {
    Circuit, Gem,
    SingleDosojinLayer,
    TransferReceptacleStatusNames,
} from '../../../core';

export function create_gem_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    const mockSdl: SingleDosojinLayer = mock(SingleDosojinLayer);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockSdl);
        reset(mockGem);

        circuitName = 'circuitName';
        circuit = new Circuit(circuitName);
    });

    test('throw circuit error when empty circuit', async () => {
        const gem: Gem = instance(mockGem);

        await expect(circuit.createGem(gem)).rejects.toThrow();
        await expect(circuit.createGem(gem)).rejects.toMatchObject({
            circuit: circuitName,
            message: 'cannot create Gem in empty Circuit',
            name: 'CircuitError',
        });
    });

    test('throw circuit error when receptacle dosojin is not set', async () => {
        const sdl: SingleDosojinLayer = instance(mockSdl);

        when(mockSdl.selectReceptacle(instance(mockGem))).thenResolve(instance(mockGem));

        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: null,
            },
        });

        circuit.pushLayer(sdl);

        await expect(circuit.createGem(instance(mockGem))).rejects.toThrow();
        await expect(circuit.createGem(instance(mockGem))).rejects.toMatchObject({
            circuit: circuitName,
            message: 'no Receptacle found after initial Gem setup',
            name: 'CircuitError',
        });
    });

    test('select and set receptacle status and set gem state when layers, dosojins and entities are properly set', async () => {
        const expectedDosojinString: string = 'dosojin';
        const sdl: SingleDosojinLayer = instance(mockSdl);

        when(mockSdl.selectReceptacle(instance(mockGem))).thenResolve(instance(mockGem));

        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: expectedDosojinString,
            },
        });

        circuit.pushLayer(sdl);

        await circuit.createGem(instance(mockGem));

        verify(mockGem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer)).once();
        verify(mockSdl.selectReceptacle(instance(mockGem))).once();
        verify(mockGem.setState(expectedDosojinString, null)).once();
    });
}
