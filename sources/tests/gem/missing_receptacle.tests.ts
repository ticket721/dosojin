import {
    Gem,
    TransferConnectorStatusNames,
} from '../../core';

export function missing_receptacle_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('set error info and gem status to \'MissingReceptacle\'', () => {
        const expectedDosojinName: string = 'dosojin';
        const expectedConnectorName: string = 'connector';
        const expectedLayer: number = 0;

        gem.transferStatus = {
            connector: {
                dosojin: expectedDosojinName,
                layer: expectedLayer,
                name: expectedConnectorName,
                status: TransferConnectorStatusNames.ReadyForTransfer,
            },
        };

        gem.missingReceptacle();

        expect(gem.errorInfo).toEqual({
            dosojin: expectedDosojinName,
            entityName: expectedConnectorName,
            entityType: 'connector',
            layer: expectedLayer,
            message: null,
        });

        expect(gem.gemStatus).toEqual('MissingReceptacle');
    });
}
