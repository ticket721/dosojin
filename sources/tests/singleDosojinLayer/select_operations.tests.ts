import {instance, mock, reset, verify, when} from 'ts-mockito';
import {
    Dosojin,
    Gem, SingleDosojinLayer
} from '../../core';

export function select_operations_tests(): void {
    let sdl: SingleDosojinLayer;
    let sdlName: string;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockDosojin);
        reset(mockGem);

        sdlName = 'sdlName';
        sdl = new SingleDosojinLayer(sdlName);
        sdl.setIndex(0);
        sdl.setRegistry(() => null, () => null);

        dosojin = instance(mockDosojin);
    });

    test('throw Layer error when sdl dosojin is not set', async () => {
        const gem: Gem = instance(mockGem);

        await expect(sdl.selectOperations(gem)).rejects.toThrow();
        await expect(sdl.selectOperations(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: `no Dosojin in Layer ${sdlName}`,
            name: 'LayerError'
        });
    });

    test('call select operations on dosojin and set operations layer on gem', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);

        when(mockDosojin.selectOperations(gem)).thenResolve(instance(mockGem));

        await sdl.selectOperations(gem);

        verify(mockDosojin.selectOperations(gem)).once();
        verify(mockGem.setOperationsLayer(sdl.index)).once();
    });
}