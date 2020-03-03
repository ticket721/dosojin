import BN                                   from 'bn.js';
import { instance, mock, reset, spy, when } from 'ts-mockito';
import { Dosojin, Gem, Receptacle }         from '../../../core';
import { RawGem }                           from '../../../core/RawGem';
import { SimpleConnectorMock }                       from '../../../mocks/connector/SimpleConnectorMock';
import { SimpleOperationMock, SimpleReceptacleMock } from '../../../mocks';

export function raw_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    let receptacle: SimpleReceptacleMock;
    let connector: SimpleConnectorMock;
    let operation: SimpleOperationMock;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({ fiat_eur: new BN(10), fiat_usd: new BN(5) });

        dosojin = instance(mockDosojin);
        connector = new SimpleConnectorMock('connector', dosojin);
        operation = new SimpleOperationMock('operation', dosojin);
        receptacle = new SimpleReceptacleMock('receptacle', dosojin);
    });

    test('recover raw gem value with connector set', async () => {

        when(mockDosojin.name).thenReturn('Dosojin');
        const spiedConnector: SimpleConnectorMock = spy(connector);
        when(spiedConnector.scopes(gem)).thenResolve(['fiat_eur', 'fiat_usd']);
        await gem.setConnectorEntity('Dosojin', connector);
        gem.addCost(dosojin, new BN('1'), 'test', 'purely testing');
        gem.addCost(dosojin, { min: new BN('1'), max: new BN('0') }, 'test', 'purely testing');
        gem.pushHistoryEntity({
            layer: 0,
            dosojin: 'Dosojin',
            entityName: 'connector',
            entityType: 'connector',
            count: 1,
        });

        const expectedRawGem: RawGem = {
            action_type: 'transfer',
            operation_status: null,
            transfer_status: {
                connector: {
                    layer: null,
                    status: null,
                    dosojin: 'Dosojin',
                    name: 'connector'
                },
                receptacle: null,
            },
            gem_status: undefined,
            gem_payload: {
                values: {
                    fiat_eur: '10',
                    fiat_usd: '5'
                },
                costs: [
                    {
                        value: '1',
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'connector',
                        entity_type: 'connector',
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
                        entity_name: 'connector',
                        entity_type: 'connector',
                        layer: null,
                        reason: 'purely testing'
                    }
                ]
            },
            error_info: null,
            route_history: [{
                layer: 0,
                dosojin: 'Dosojin',
                entity_name: 'connector',
                entity_type: 'connector',
                count: 1,
            }],
            gem_data: {},
            refresh_timer: null
        };

        const rawGem: RawGem = gem.raw;

        expect(rawGem).toEqual(expectedRawGem);

        const newGem = new Gem().load(rawGem);

        const secondRawGem: RawGem = newGem.raw;

        expect(secondRawGem).toEqual(rawGem);

    });

    test('recover raw gem value with receptacle set', async () => {

        when(mockDosojin.name).thenReturn('Dosojin');
        const spiedReceptacle: SimpleReceptacleMock = spy(receptacle);
        when(spiedReceptacle.scopes(gem)).thenResolve(['fiat_eur', 'fiat_usd']);
        await gem.setReceptacleEntity('Dosojin', receptacle);
        gem.addCost(dosojin, new BN('1'), 'test', 'purely testing');
        gem.addCost(dosojin, { min: new BN('1'), max: new BN('0') }, 'test', 'purely testing');

        const expectedRawGem: any = {
            action_type: 'transfer',
            operation_status: null,
            transfer_status: {
                receptacle: {
                    layer: null,
                    status: null,
                    dosojin: 'Dosojin',
                    name: 'receptacle'
                },
                connector: null,
            },
            gem_status: undefined,
            gem_payload: {
                values: {
                    fiat_eur: '10',
                    fiat_usd: '5'
                },
                costs: [
                    {
                        value: '1',
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'receptacle',
                        entity_type: 'receptacle',
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
                        entity_name: 'receptacle',
                        entity_type: 'receptacle',
                        layer: null,
                        reason: 'purely testing'
                    }
                ]
            },
            error_info: null,
            route_history: [],
            gem_data: {},
            refresh_timer: null
        };

        const rawGem: RawGem = gem.raw;

        expect(rawGem).toEqual(expectedRawGem);

        const newGem = new Gem().load(rawGem);

        const secondRawGem: RawGem = newGem.raw;

        expect(secondRawGem).toEqual(rawGem);

    });

    test('recover raw gem value with operation set', async () => {

        when(mockDosojin.name).thenReturn('Dosojin');
        const spiedOperation: SimpleOperationMock = spy(operation);
        when(spiedOperation.scopes(gem)).thenResolve(['fiat_eur', 'fiat_usd']);
        gem.setActionType('operation');
        await gem.setOperationEntities('Dosojin', [operation]);
        gem.addCost(dosojin, new BN('1'), 'test', 'purely testing');
        gem.addCost(dosojin, { min: new BN('1'), max: new BN('0') }, 'test', 'purely testing');

        const expectedRawGem: any = {
            action_type: 'operation',
            operation_status: {
                status: undefined,
                layer: undefined,
                dosojin: 'Dosojin',
                operation_list: [
                    'operation'
                ]
            },
            transfer_status: null,
            gem_status: undefined,
            gem_payload: {
                values: {
                    fiat_eur: '10',
                    fiat_usd: '5'
                },
                costs: [
                    {
                        value: '1',
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'operation',
                        entity_type: 'operation',
                        layer: undefined,
                        reason: 'purely testing'
                    },
                    {
                        value: {
                            min: '1',
                            max: '0'
                        },
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'operation',
                        entity_type: 'operation',
                        layer: undefined,
                        reason: 'purely testing'
                    }
                ]
            },
            error_info: null,
            route_history: [],
            gem_data: {},
            refresh_timer: null
        };

        const rawGem: RawGem = gem.raw;

        expect(rawGem).toEqual(expectedRawGem);

        const newGem = new Gem().load(rawGem);

        const secondRawGem: RawGem = newGem.raw;

        expect(secondRawGem).toEqual(rawGem);

    });

    test('recover raw gem value with error info set', async () => {

        when(mockDosojin.name).thenReturn('Dosojin');
        const spiedOperation: SimpleOperationMock = spy(operation);
        when(spiedOperation.scopes(gem)).thenResolve(['fiat_eur', 'fiat_usd']);
        gem.setActionType('operation');
        await gem.setOperationEntities('Dosojin', [operation]);
        gem.addCost(dosojin, new BN('1'), 'test', 'purely testing');
        gem.addCost(dosojin, { min: new BN('1'), max: new BN('0') }, 'test', 'purely testing');
        gem.error(dosojin, 'error occured');

        const expectedRawGem: any = {
            action_type: 'operation',
            operation_status: {
                status: undefined,
                layer: undefined,
                dosojin: 'Dosojin',
                operation_list: [
                    'operation'
                ]
            },
            transfer_status: null,
            gem_status: 'Error',
            gem_payload: {
                values: {
                    fiat_eur: '10',
                    fiat_usd: '5'
                },
                costs: [
                    {
                        value: '1',
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'operation',
                        entity_type: 'operation',
                        layer: undefined,
                        reason: 'purely testing'
                    },
                    {
                        value: {
                            min: '1',
                            max: '0'
                        },
                        scope: 'test',
                        dosojin: 'Dosojin',
                        entity_name: 'operation',
                        entity_type: 'operation',
                        layer: undefined,
                        reason: 'purely testing'
                    }
                ]
            },
            error_info: {
                dosojin: 'Dosojin',
                entity_name: 'operation',
                entity_type: 'operation',
                layer: undefined,
                message: 'error occured',
            },
            route_history: [],
            gem_data: {},
            refresh_timer: null
        };

        const rawGem: RawGem = gem.raw;

        expect(rawGem).toEqual(expectedRawGem);

        const newGem = new Gem().load(rawGem);

        const secondRawGem: RawGem = newGem.raw;

        expect(secondRawGem).toEqual(rawGem);

    });


}
