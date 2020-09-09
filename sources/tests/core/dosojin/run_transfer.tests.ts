import { deepEqual, instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { Dosojin, Gem } from '../../../core';
import { SimpleConnectorMock } from '../../../mocks/connector/SimpleConnectorMock';
import { SimpleReceptacleMock } from '../../../mocks/receptacle/SimpleReceptacleMock';

export function run_transfer_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        when(mockGem.actionType).thenReturn('transfer');
        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw dosojin error when transfer status is null', async () => {
        const gem: Gem = instance(mockGem);

        await expect(dosojin.runTransfer(gem, false)).rejects.toThrow();
        await expect(dosojin.runTransfer(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: "received Gem with null transferStatus while on 'transfer' actionType",
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when connector and receptacle status are null', async () => {
        when(mockGem.transferStatus).thenReturn({
            connector: null,
            receptacle: null,
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runTransfer(gem, false)).rejects.toThrow();
        await expect(dosojin.runTransfer(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with 'transfer' action type, but no Connector or Receptacle for ${dosojinName} dosojin`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin does not contain the corresponding connector', async () => {
        const expectedConnectorName: string = 'connector';

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                dosojin: dosojinName,
                name: expectedConnectorName,
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runTransfer(gem, false)).rejects.toThrow();
        await expect(dosojin.runTransfer(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `unknown Connector ${expectedConnectorName} in Dosojin ${dosojinName}`,
            name: 'DosojinError',
        });
    });

    test('run gem on connector and add connector history when dosojin contains corresponding connector', async () => {
        const expectedLayer: number = 0;
        const expectedConnectorName: string = 'connector';

        const mockConnector: SimpleConnectorMock = new SimpleConnectorMock(expectedConnectorName, dosojin);

        const spiedConnector: SimpleConnectorMock = spy(mockConnector);

        dosojin.addConnector(mockConnector);

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: expectedLayer,
                dosojin: dosojinName,
                name: expectedConnectorName,
            },
        });

        when(mockGem.routeHistory).thenReturn([]);

        const gem: Gem = instance(mockGem);

        await dosojin.runTransfer(gem, false);

        verify(spiedConnector.run(gem)).once();

        verify(
            mockGem.pushHistoryEntity(
                deepEqual({
                    count: 1,
                    dosojin: dosojinName,
                    entityName: expectedConnectorName,
                    entityType: 'connector',
                    layer: expectedLayer,
                }),
            ),
        ).once();
    });

    test('dry run gem on connector and add connector history when dosojin contains corresponding connector', async () => {
        const expectedLayer: number = 0;
        const expectedConnectorName: string = 'connector';

        const mockConnector: SimpleConnectorMock = new SimpleConnectorMock(expectedConnectorName, dosojin);

        const spiedConnector: SimpleConnectorMock = spy(mockConnector);

        dosojin.addConnector(mockConnector);

        when(mockGem.transferStatus).thenReturn({
            connector: {
                ...mockGem.transferStatus.connector,
                layer: expectedLayer,
                dosojin: dosojinName,
                name: expectedConnectorName,
            },
        });

        when(mockGem.routeHistory).thenReturn([]);

        const gem: Gem = instance(mockGem);

        await dosojin.runTransfer(gem, true);

        verify(spiedConnector.dryRun(gem)).once();

        verify(
            mockGem.pushHistoryEntity(
                deepEqual({
                    count: 1,
                    dosojin: dosojinName,
                    entityName: expectedConnectorName,
                    entityType: 'connector',
                    layer: expectedLayer,
                }),
            ),
        ).once();
    });

    test('throw dosojin error when dosojin does not contain the corresponding receptacle', async () => {
        const expectedReceptacleName: string = 'receptacle';

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                dosojin: dosojinName,
                name: expectedReceptacleName,
            },
        });

        const gem: Gem = instance(mockGem);

        await expect(dosojin.runTransfer(gem, false)).rejects.toThrow();
        await expect(dosojin.runTransfer(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `unknown Receptacle ${expectedReceptacleName} in Dosojin ${dosojinName}`,
            name: 'DosojinError',
        });
    });

    test('run gem on receptacle and add receptacle history when dosojin contains corresponding receptacle', async () => {
        const expectedLayer: number = 0;
        const expectedReceptacleName: string = 'receptacle';

        const mockReceptacle: SimpleReceptacleMock = new SimpleReceptacleMock(expectedReceptacleName, dosojin);

        const spiedReceptacle: SimpleReceptacleMock = spy(mockReceptacle);

        dosojin.addReceptacle(mockReceptacle);

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: expectedLayer,
                dosojin: dosojinName,
                name: expectedReceptacleName,
            },
        });

        when(mockGem.routeHistory).thenReturn([]);

        const gem: Gem = instance(mockGem);

        await dosojin.runTransfer(gem, false);

        verify(spiedReceptacle.run(gem)).once();

        verify(
            mockGem.pushHistoryEntity(
                deepEqual({
                    count: 1,
                    dosojin: dosojinName,
                    entityName: expectedReceptacleName,
                    entityType: 'receptacle',
                    layer: expectedLayer,
                }),
            ),
        ).once();
    });

    test('dry run gem on receptacle and add receptacle history when dosojin contains corresponding receptacle', async () => {
        const expectedLayer: number = 0;
        const expectedReceptacleName: string = 'receptacle';

        const mockReceptacle: SimpleReceptacleMock = new SimpleReceptacleMock(expectedReceptacleName, dosojin);

        const spiedReceptacle: SimpleReceptacleMock = spy(mockReceptacle);

        dosojin.addReceptacle(mockReceptacle);

        when(mockGem.transferStatus).thenReturn({
            receptacle: {
                ...mockGem.transferStatus.receptacle,
                layer: expectedLayer,
                dosojin: dosojinName,
                name: expectedReceptacleName,
            },
        });

        when(mockGem.routeHistory).thenReturn([]);

        const gem: Gem = instance(mockGem);

        await dosojin.runTransfer(gem, true);

        verify(spiedReceptacle.dryRun(gem)).once();

        verify(
            mockGem.pushHistoryEntity(
                deepEqual({
                    count: 1,
                    dosojin: dosojinName,
                    entityName: expectedReceptacleName,
                    entityType: 'receptacle',
                    layer: expectedLayer,
                }),
            ),
        ).once();
    });
}
