import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    LayerError,
    SingleDosojinLayer,
} from '../../core';

export function dry_run_tests(): void {
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

        await expect(sdl.dryRun(gem)).rejects.toThrow();
        await expect(sdl.dryRun(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: `no Dosojin in Layer ${sdlName}`,
            name: 'LayerError',
        });
    });

    test('throw Layer error when gem action type is invalid', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn(null);

        await expect(sdl.dryRun(gem)).rejects.toThrow();
        await expect(sdl.dryRun(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'LayerError',
        });
    });

    test('throw Layer error when run Operation failed', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        when(spiedSdl.dryRunOperation(gem)).thenThrow(new LayerError(0, `operation failed`));

        await expect(sdl.dryRun(gem)).rejects.toThrow();
        await expect(sdl.dryRun(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'operation failed',
            name: 'LayerError',
        });
    });

    test('throw Layer error when run Transfer failed', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        when(spiedSdl.dryRunTransfer(gem)).thenThrow(new LayerError(0, `transfer failed`));

        await expect(sdl.dryRun(gem)).rejects.toThrow();
        await expect(sdl.dryRun(gem)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'transfer failed',
            name: 'LayerError',
        });
    });

    test('call dry run operation once when actionType is operation', async () => {
        sdl.setDosojin(dosojin);

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        const gem: Gem = instance(mockGem);

        when (mockGem.actionType).thenReturn('operation');

        when(spiedSdl.dryRunOperation(gem)).thenResolve(instance(mockGem));

        await sdl.dryRun(gem);

        verify(spiedSdl.dryRunOperation(gem)).once();
    });

    test('call dry run transfer once when actionType is transfer', async () => {
        sdl.setDosojin(dosojin);

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        const gem: Gem = instance(mockGem);

        when (mockGem.actionType).thenReturn('transfer');

        when(spiedSdl.dryRunTransfer(gem)).thenResolve(instance(mockGem));

        await sdl.dryRun(gem);

        verify(spiedSdl.dryRunTransfer(gem)).once();
    });
}
