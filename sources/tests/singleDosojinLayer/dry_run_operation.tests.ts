import { instance, mock, reset, verify, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    SingleDosojinLayer,
} from '../../core';

export function dry_run_operation_tests(): void {
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

        sdl.setDosojin(dosojin);
    });

    test('throw Layer error when gem operation status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(sdl.dryRunOperation(gem)).rejects.toThrow();
        await expect(sdl.dryRunOperation(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'received Gem with null operationStatus',
            name: 'LayerError',
        });
    });

    test('throw Layer error when gem operation status layer does not match current layer', async () => {
        when(mockGem.operationStatus).thenReturn({
            ...mockGem.operationStatus,
            layer: 1,
        });

        const gem: Gem = instance(mockGem);

        await expect(sdl.dryRunOperation(gem)).rejects.toThrow();
        await expect(sdl.dryRunOperation(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: `received Gem with invalid index: got 1, expected ${sdl.index}`,
            name: 'LayerError',
        });
    });

    test('dry run gem on dosojin when gem operations layer match current layer', async () => {
        when(mockGem.operationStatus).thenReturn({
            ...mockGem.operationStatus,
            layer: 0,
        });

        const gem: Gem = instance(mockGem);

        await sdl.dryRunOperation(gem);

        verify(mockDosojin.dryRun(gem)).once();
    });
}
