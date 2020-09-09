import { Gem } from '../../../core';

export function set_receptacle_layer_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test("throw error when action type is not 'transfer'", () => {
        gem.setActionType('operation');

        try {
            expect(gem.setReceptacleLayer(0)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setReceptacleLayer call (operation instead of transfer)',
            });
        }
    });

    test("set layer when action type is 'transfer'", () => {
        const expectedLayer: number = 0;

        gem.setReceptacleLayer(expectedLayer);

        expect(gem.transferStatus.receptacle).toMatchObject({
            layer: expectedLayer,
        });
    });
}
