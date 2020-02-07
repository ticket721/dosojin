import {deepEqual, instance, mock, reset, verify, when} from 'ts-mockito';
import {
    Dosojin, DosojinError,
    Gem, SingleDosojinLayer,
} from '../../../core';

export function set_connector_info_tests(): void {
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

    test('throw layer error when sdl dosojin is not set', async () => {
        const gem: Gem = instance(mockGem);

        await expect(sdl.setConnectorInfo(gem, {})).rejects.toThrow();
        await expect(sdl.setConnectorInfo(gem, {})).rejects.toMatchObject({
            layer: sdl.index,
            message: `no Dosojin in Layer ${sdlName}`,
            name: 'LayerError',
        });
    });

    test('throw layer error when action type is not transfer', async () => {
        sdl.setDosojin(dosojin);
        when(mockGem.actionType).thenReturn('operation');

        const gem: Gem = instance(mockGem);

        await expect(sdl.setConnectorInfo(gem, {})).rejects.toThrow();
        await expect(sdl.setConnectorInfo(gem, {})).rejects.toMatchObject({
            layer: 0,
            message: `received Gem with invalid actionType ${gem.actionType} while setting Connector info`,
            name: 'LayerError',
        });
    });

    test('throw layer error when set connector info fail', async () => {
        const expectedInfo = {
            'info': 'value',
        };

        sdl.setDosojin(dosojin);
        when(mockGem.actionType).thenReturn('transfer');

        const gem: Gem = instance(mockGem);

        when(mockDosojin.setConnectorInfo(gem, deepEqual(expectedInfo))).thenThrow(new DosojinError('dosojin', 'set connector info failed'));

        await expect(sdl.setConnectorInfo(gem, expectedInfo)).rejects.toThrow();
        await expect(sdl.setConnectorInfo(gem, expectedInfo)).rejects.toMatchObject({
            layer: 0,
            message: 'set connector info failed',
            name: 'LayerError',
        });
    });

    test('get connector info from dosojin', async () => {
        const expectedInfo = {
            'info': 'value',
        };

        sdl.setDosojin(dosojin);
        when(mockGem.actionType).thenReturn('transfer');

        const gem: Gem = instance(mockGem);

        await sdl.setConnectorInfo(gem, expectedInfo);

        verify(mockDosojin.setConnectorInfo(gem, deepEqual(expectedInfo))).once();
    });
}
