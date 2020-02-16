import {
    Gem,
} from '../../../core';

export function set_action_type_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});

        gem.transferStatus = {};
        gem.operationStatus = {};
    });

    test('set operation status to null when specified parameter is transfer', () => {
        gem.setActionType('transfer');

        expect(gem.operationStatus).toBeNull();
        expect(gem.transferStatus).toEqual({});
    });

    test('set transfer status to null when specified parameter is operation', () => {
        gem.setActionType('operation');

        expect(gem.transferStatus).toBeNull();
        expect(gem.operationStatus).toEqual({});
    });
}
