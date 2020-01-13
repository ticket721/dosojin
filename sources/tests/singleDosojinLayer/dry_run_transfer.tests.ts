import { instance, mock, reset, verify, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    SingleDosojinLayer,
} from '../../core';

export function dry_run_transfer_tests(): void {
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

    test('throw Layer error when gem transfer status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(sdl.dryRunTransfer(gem)).rejects.toThrow();
        await expect(sdl.dryRunTransfer(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'received Gem with null transferStatus',
            name: 'LayerError',
        });
    });

    test('throw Layer error when gem transfer status layer does not match current layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 1,
            },
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: 1,
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(sdl.dryRunTransfer(gem)).rejects.toThrow();
        await expect(sdl.dryRunTransfer(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: `received Gem with \'transfer\' action type, but no Connector or Receptacle for ${sdlName} layer`,
            name: 'LayerError',
        });
    });

    test('dry run gem on dosojin when gem connector layer match current layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: 0,
            },
        });

        const gem: Gem = instance(mockGem);

        await sdl.dryRunTransfer(gem);

        verify(mockDosojin.dryRun(gem)).once();
    });

    test('dry run gem on dosojin when gem receptacle layer match current layer', async () => {
        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: 0,
            },
        });

        const gem: Gem = instance(mockGem);

        await sdl.dryRunTransfer(gem);

        verify(mockDosojin.dryRun(gem)).once();
    });
}
