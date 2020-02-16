import BN from 'bn.js';
import {
    Gem,
} from '../../../core';

export function check_scopes_compatibility_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({fiat_eur: new BN(10), fiat_usd: new BN(5)});
    });

    test('return false when specified scope list is empty', () => {
        expect(gem.checkScopesCompatibility([])).toBeFalsy();
    });

    test('return false when specified scopes missing some gem scopes', () => {
        expect(gem.checkScopesCompatibility(['fiat_eur'])).toBeFalsy();
    });

    test('return false when specified scopes contain incompatible scope', () => {
        expect(gem.checkScopesCompatibility(['fiat_eur', 'fiat_usd', 'crypto_eth'])).toBeFalsy();
    });

    test('return true when specified scope list is exactly gem scopes', () => {
        expect(gem.checkScopesCompatibility(['fiat_eur', 'fiat_usd'])).toBeTruthy();
    });
}
