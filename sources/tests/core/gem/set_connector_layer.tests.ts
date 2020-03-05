import { Gem } from '../../../core';

export function set_connector_layer_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test("throw error when action type is not 'transfer'", () => {
        gem.setActionType('operation');

        try {
            expect(gem.setConnectorLayer(0)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setConnectorLayer call (operation instead of transfer)',
            });
        }
    });

    test("set layer when action type is 'transfer'", () => {
        const expectedLayer: number = 0;

        gem.setConnectorLayer(expectedLayer);

        expect(gem.transferStatus.connector).toMatchObject({
            layer: expectedLayer,
        });
    });
}
