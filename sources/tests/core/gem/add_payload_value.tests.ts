import BN from 'bn.js';
import { Gem } from '../../../core';

export function add_payload_value_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({ fiat_eur: new BN(10), fiat_usd: new BN(5) });
    });

    test('add a number value to a scope that does not exist yet', () => {
        gem.addPayloadValue('crypto_eth', 100);

        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(100));
    });

    test('add a BN value to a scope that does not exist yet', () => {
        gem.addPayloadValue('crypto_eth', new BN(100));

        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(100));
    });

    test('add a number value to a scope that already exist without erasing previous value', () => {
        gem.addPayloadValue('fiat_eur', 20);

        expect(gem.gemPayload.values['fiat_eur']).toEqual(new BN(30));
    });

    test('add a BN value to a scope that already exist without erasing previous value', () => {
        gem.addPayloadValue('fiat_eur', new BN(20));

        expect(gem.gemPayload.values['fiat_eur']).toEqual(new BN(30));
    });
}
