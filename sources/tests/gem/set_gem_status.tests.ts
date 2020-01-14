import {
    Gem,
} from '../../core';

export function set_gem_status_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('reset error info when specified parameter is neither \'Error\' nor \'Fatal\'', () => {
        gem.setGemStatus('Running');

        expect(gem.errorInfo).toBeNull();
    });
}
