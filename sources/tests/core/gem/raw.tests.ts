import BN                                      from 'bn.js';
import { instance, mock, reset, spy, when }    from 'ts-mockito';
import { Connector, Dosojin, Gem, Receptacle } from '../../../core';
import { RawGem }                              from '../../../core/RawGem';
import { SimpleConnectorMock }                 from '../../../mocks/connector/SimpleConnectorMock';

export function raw_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    const mockReceptacle: Receptacle = mock(Receptacle);
    let receptacle: Receptacle;
    let connector: SimpleConnectorMock;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({ fiat_eur: new BN(10), fiat_usd: new BN(5) });

        dosojin = instance(mockDosojin);
        receptacle = instance(mockReceptacle);
        connector = new SimpleConnectorMock('connector', dosojin);
    });

    test('recover raw gem value', async () => {

        when(mockDosojin.name).thenReturn('Dosojin');
        when(mockReceptacle.name).thenReturn('Receptacle');
        const spiedConnector: SimpleConnectorMock = spy(connector);
        when(spiedConnector.scopes(gem)).thenResolve(['fiat_eur', 'fiat_usd']);
        await gem.setConnectorEntity('Dosojin', connector);
        gem.addCost(dosojin, new BN('1'), 'test', 'purely testing');
        gem.addCost(dosojin, { min: new BN('1'), max: new BN('0') }, 'test', 'purely testing');

        const expectedRawGem: any = {
            actionType: 'transfer',
            operationStatus: null,
            transferStatus: {
                connector: {
                    layer: null,
                    status: null,
                    dosojin: 'Dosojin',
                    name: 'connector'
                }
            },
            gemPayload: {
                values: {
                    fiat_eur: '10',
                    fiat_usd: '5'
                },
                costs: [
                    {
                        value: '1',
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entityName: 'connector',
                        entityType: 'connector',
                        layer: null,
                        reason: 'purely testing'
                    },
                    {
                        value: {
                            min: '1',
                            max: '0'
                        },
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entityName: 'connector',
                        entityType: 'connector',
                        layer: null,
                        reason: 'purely testing'
                    }
                ]
            },
            errorInfo: null,
            routeHistory: [],
            gemData: {},
            refreshTimer: null
        };

        const rawGem: RawGem = gem.raw;

        expect(rawGem).toEqual(expectedRawGem);

        const newGem = new Gem().load(rawGem);

        const secondRawGem: RawGem = newGem.raw;

        expect(secondRawGem).toEqual(rawGem);

    });

}
