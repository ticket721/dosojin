import {deepEqual, instance, mock, reset, spy, verify, when} from 'ts-mockito';
import {
    Dosojin,
    Gem,
} from '../../../core';
import {SimpleReceptacleMock} from '../../../mocks/receptacle/SimpleReceptacleMock';

export function set_connector_info_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw dosojin error when action type is invalid', async () => {
        const gem: Gem = instance(mockGem);

        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with invalid actionType ${gem.actionType} while getting Receptacle info`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when receptacle status is not set or invalid', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: 'invalidDosojin',
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with 'transfer' action type, but no Connector or Receptacle for ${dosojinName} Dosojin`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin does not contain corresponding receptacle', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: dosojinName,
                name: 'receptacle',
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setConnectorInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `unknown Receptacle receptacle in Dosojin ${dosojinName}`,
            name: 'DosojinError',
        });
    });

    test('set connector info on receptacle when dosojin contains corresponding receptacle', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        const expectedReceptacleName: string = 'receptacle';

        const mockReceptacle: SimpleReceptacleMock = new SimpleReceptacleMock(expectedReceptacleName, dosojin);

        const spiedReceptacle: SimpleReceptacleMock = spy(mockReceptacle);

        dosojin.addReceptacle(mockReceptacle);

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: dosojinName,
                name: expectedReceptacleName,
            },
        });

        const gem: Gem = instance(mockGem);

        await dosojin.setConnectorInfo(gem, {});

        verify(spiedReceptacle.setConnectorInfo(deepEqual({}))).once();
    });
}
