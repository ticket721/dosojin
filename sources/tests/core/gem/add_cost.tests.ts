import BN from 'bn.js';
import { instance, mock, reset, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    OperationStatusNames,
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
} from '../../../core';

export function add_cost_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({ fiat_eur: new BN(10), fiat_usd: new BN(5) });

        dosojin = instance(mockDosojin);
    });

    test('throw error when action type is not set', () => {
        gem.setActionType(null);

        try {
            expect(gem.addCost(dosojin, new BN(2), 'fiat_eur', 'for testing purposes')).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Cannot add cost on gem with no actionType',
            });
        }
    });

    test('throw error when specified dosojin does not match gem connector or receptacle dosojin', () => {
        gem.transferStatus = {
            connector: {
                dosojin: 'dosojin',
                layer: 0,
                name: 'connector',
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
            receptacle: {
                dosojin: 'dosojin',
                layer: 0,
                name: 'receptacle',
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        };

        when(mockDosojin.name).thenReturn('invalidDosojin');

        try {
            expect(gem.addCost(dosojin, new BN(2), 'fiat_eur', 'for testing purposes')).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Cannot find specified dosojin inside transferStatus',
            });
        }
    });

    test('push new cost when specified dosojin match gem connector dosojin', () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedConnectorName: string = 'connector';
        const expectedLayer: number = 0;
        const expectedReason: string = 'for testing purposes';
        const expectedScope: string = 'fiat_eur';
        const expectedValue: BN = new BN(2);

        gem.transferStatus = {
            connector: {
                dosojin: expectedDosojinName,
                layer: expectedLayer,
                name: expectedConnectorName,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.addCost(dosojin, expectedValue, expectedScope, expectedReason);

        expect(gem.gemPayload.costs).toEqual([
            {
                dosojin: expectedDosojinName,
                entityName: expectedConnectorName,
                entityType: 'connector',
                layer: expectedLayer,
                reason: expectedReason,
                scope: expectedScope,
                value: expectedValue,
            },
        ]);
    });

    test('push new cost when specified dosojin match gem receptacle dosojin', () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedReceptacleName: string = 'receptacle';
        const expectedLayer: number = 0;
        const expectedReason: string = 'for testing purposes';
        const expectedScope: string = 'fiat_eur';
        const expectedValue: BN = new BN(2);

        gem.transferStatus = {
            receptacle: {
                dosojin: expectedDosojinName,
                layer: expectedLayer,
                name: expectedReceptacleName,
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.addCost(dosojin, expectedValue, expectedScope, expectedReason);

        expect(gem.gemPayload.costs).toEqual([
            {
                dosojin: expectedDosojinName,
                entityName: expectedReceptacleName,
                entityType: 'receptacle',
                layer: expectedLayer,
                reason: expectedReason,
                scope: expectedScope,
                value: expectedValue,
            },
        ]);
    });

    test("push new cost when action type is 'operation'", () => {
        gem.setActionType('operation');

        const expectedDosojinName: string = 'dosojin';
        const expectedOperationName: string = 'op_1';
        const expectedLayer: number = 0;
        const expectedReason: string = 'for testing purposes';
        const expectedScope: string = 'fiat_eur';
        const expectedValue: BN = new BN(2);

        gem.operationStatus = {
            dosojin: 'dosojin',
            layer: 0,
            operation_list: [expectedOperationName, 'op_2'],
            status: OperationStatusNames.ReadyForOperation,
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.addCost(dosojin, expectedValue, expectedScope, expectedReason);

        expect(gem.gemPayload.costs).toEqual([
            {
                dosojin: expectedDosojinName,
                entityName: expectedOperationName,
                entityType: 'operation',
                layer: expectedLayer,
                reason: expectedReason,
                scope: expectedScope,
                value: expectedValue,
            },
        ]);
    });
}
