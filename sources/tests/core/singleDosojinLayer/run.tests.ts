import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { Dosojin, Gem, LayerError, SingleDosojinLayer } from '../../../core';

export function run_tests(): void {
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
        sdl.setRegistry(
            () => null,
            () => null,
        );

        dosojin = instance(mockDosojin);
    });

    test('throw Layer error when sdl dosojin is not set', async () => {
        const gem: Gem = instance(mockGem);

        await expect(sdl.run(gem, false)).rejects.toThrow();
        await expect(sdl.run(gem, false)).rejects.toMatchObject({
            layer: sdl.index,
            message: `no Dosojin in Layer ${sdlName}`,
            name: 'LayerError',
        });
    });

    test('throw Layer error when gem action type is invalid', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when(mockGem.actionType).thenReturn(null);

        await expect(sdl.run(gem, false)).rejects.toThrow();
        await expect(sdl.run(gem, false)).rejects.toMatchObject({
            layer: sdl.index,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'LayerError',
        });
    });

    test('throw Layer error when run Operation failed', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when(mockGem.actionType).thenReturn('operation');

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        when(spiedSdl.runOperation(gem, false)).thenThrow(new LayerError(0, `operation failed`));

        await expect(sdl.run(gem, false)).rejects.toThrow();
        await expect(sdl.run(gem, false)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'operation failed',
            name: 'LayerError',
        });
    });

    test('throw Layer error when run Transfer failed', async () => {
        sdl.setDosojin(dosojin);

        const gem: Gem = instance(mockGem);
        when(mockGem.actionType).thenReturn('transfer');

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        when(spiedSdl.runTransfer(gem, false)).thenThrow(new LayerError(0, `transfer failed`));

        await expect(sdl.run(gem, false)).rejects.toThrow();
        await expect(sdl.run(gem, false)).rejects.toMatchObject({
            layer: sdl.index,
            message: 'transfer failed',
            name: 'LayerError',
        });
    });

    test('call run operation once when actionType is operation', async () => {
        sdl.setDosojin(dosojin);

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        const gem: Gem = instance(mockGem);

        when(mockGem.actionType).thenReturn('operation');

        when(spiedSdl.runOperation(gem, false)).thenResolve(instance(mockGem));

        await sdl.run(gem, false);

        verify(spiedSdl.runOperation(gem, false)).once();
    });

    test('call run transfer once when actionType is transfer', async () => {
        sdl.setDosojin(dosojin);

        const spiedSdl: SingleDosojinLayer = spy(sdl);

        const gem: Gem = instance(mockGem);

        when(mockGem.actionType).thenReturn('transfer');

        when(spiedSdl.runTransfer(gem, false)).thenResolve(instance(mockGem));

        await sdl.run(gem, false);

        verify(spiedSdl.runTransfer(gem, false)).once();
    });
}
