import { instance, mock, reset, when } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    OperationStatusNames,
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
} from '../../../core';

export function fatal_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({});
        dosojin = instance(mockDosojin);
    });

    test('throw error when action type is not set', () => {
        gem.setActionType(null);

        try {
            expect(gem.fatal(dosojin, 'testing fatal message')).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Cannot set error on gem with no actionType',
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
            expect(gem.fatal(dosojin, 'testing fatal message')).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Cannot find specified dosojin inside transferStatus',
            });
        }
    });

    test("set error info and gem status to 'Fatal' when connector transfer status is set", () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedConnectorName: string = 'connector';
        const expectedLayer: number = 0;
        const expectedMessage: string = 'testing fatal message';

        gem.transferStatus = {
            connector: {
                dosojin: expectedDosojinName,
                layer: expectedLayer,
                name: expectedConnectorName,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.fatal(dosojin, expectedMessage);

        expect(gem.errorInfo).toEqual({
            dosojin: expectedDosojinName,
            entityName: expectedConnectorName,
            entityType: 'connector',
            layer: expectedLayer,
            message: expectedMessage,
        });

        expect(gem.gemStatus).toEqual('Fatal');
    });

    test("set error info and gem status to 'Fatal' when receptacle transfer status is set", () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedReceptacleName: string = 'receptacle';
        const expectedLayer: number = 0;
        const expectedMessage: string = 'testing fatal message';

        gem.transferStatus = {
            receptacle: {
                dosojin: expectedDosojinName,
                layer: expectedLayer,
                name: expectedReceptacleName,
                status: TransferReceptacleStatusNames.ReadyForTransfer,
            },
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.fatal(dosojin, expectedMessage);

        expect(gem.errorInfo).toEqual({
            dosojin: expectedDosojinName,
            entityName: expectedReceptacleName,
            entityType: 'receptacle',
            layer: expectedLayer,
            message: expectedMessage,
        });

        expect(gem.gemStatus).toEqual('Fatal');
    });

    test("set error info and gem status to 'Fatal' when operation status is set", () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedOperationName: string = 'operation';
        const expectedLayer: number = 0;
        const expectedMessage: string = 'testing fatal message';

        gem.setActionType('operation');

        gem.operationStatus = {
            dosojin: expectedDosojinName,
            layer: expectedLayer,
            operation_list: [expectedOperationName],
            status: OperationStatusNames.ReadyForOperation,
        };

        when(mockDosojin.name).thenReturn(expectedDosojinName);

        gem.fatal(dosojin, expectedMessage);

        expect(gem.errorInfo).toEqual({
            dosojin: expectedDosojinName,
            entityName: expectedOperationName,
            entityType: 'operation',
            layer: expectedLayer,
            message: expectedMessage,
        });

        expect(gem.gemStatus).toEqual('Fatal');
    });
}
