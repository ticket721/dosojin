import {
    Gem,
} from '../../core';

export function set_operations_layer_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('throw error when action type is not \'operation\'', () => {
        try {
            expect(gem.setOperationsLayer(0)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setOperationsLayer call (transfer instead of operation)',
            });
        }
    });

    test('set layer when action type is \'operation\'', () => {
        gem.setActionType('operation');

        const expectedLayer: number = 0;

        gem.setOperationsLayer(expectedLayer);

        expect(gem.operationStatus).toMatchObject({
            layer: expectedLayer,
        });
    });
}
