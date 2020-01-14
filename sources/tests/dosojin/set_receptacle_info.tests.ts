import {deepEqual, instance, mock, reset, spy, verify, when} from 'ts-mockito';
import {
    Dosojin,
    Gem,
} from '../../core';
import {SimpleConnectorMock} from '../../mocks/connector/SimpleConnectorMock';

export function set_receptacle_info_tests(): void {
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

        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with invalid actionType ${gem.actionType} while getting Connector info`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when connector status is not set or invalid', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                dosojin: 'invalidDosojin',
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with 'transfer' action type, but no Connector or Receptacle for ${dosojinName} Dosojin`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin does not contain corresponding connector', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                dosojin: dosojinName,
                name: 'connector',
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toThrow();
        await expect(dosojin.setReceptacleInfo(gem, {})).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `unknown Connector connector in Dosojin ${dosojinName}`,
            name: 'DosojinError',
        });
    });

    test('set receptacle info on connector when dosojin contains corresponding connector', async () => {
        when(mockGem.actionType).thenReturn('transfer');

        const expectedConnectorName: string = 'connector';

        const mockConnector: SimpleConnectorMock = new SimpleConnectorMock(expectedConnectorName, dosojin);

        const spiedConnector: SimpleConnectorMock = spy(mockConnector);

        dosojin.addConnector(mockConnector);

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                dosojin: dosojinName,
                name: expectedConnectorName,
            },
        });

        const gem: Gem = instance(mockGem);

        await dosojin.setReceptacleInfo(gem, {});

        verify(spiedConnector.setReceptacleInfo(deepEqual({}))).once();
    });
}
