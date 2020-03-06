import BN from 'bn.js';
import { Gem } from '../../../core';

export function exchange_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({ fiat_eur: new BN(10), fiat_usd: new BN(5) });
    });

    test('exchange currency for another that does not exist', () => {
        gem.addPayloadValue('crypto_eth', 100);

        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(100));

        gem.exchange('crypto_eth', 'crypto_btc', new BN(100), 0.5);

        expect(gem.gemPayload.values['crypto_btc']).toEqual(new BN(50));
        expect(gem.gemPayload.values['crypto_eth']).toBeUndefined();
    });

    test('exchange currency for another that does exist', () => {
        gem.addPayloadValue('crypto_eth', 100);
        gem.addPayloadValue('crypto_btc', 100);

        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(100));
        expect(gem.gemPayload.values['crypto_btc']).toEqual(new BN(100));

        gem.exchange('crypto_eth', 'crypto_btc', new BN(100), 0.5);

        expect(gem.gemPayload.values['crypto_btc']).toEqual(new BN(150));
        expect(gem.gemPayload.values['crypto_eth']).toBeUndefined();
    });

    test('partially exchange currency for another that does exist', () => {
        gem.addPayloadValue('crypto_eth', 100);
        gem.addPayloadValue('crypto_btc', 100);

        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(100));
        expect(gem.gemPayload.values['crypto_btc']).toEqual(new BN(100));

        gem.exchange('crypto_eth', 'crypto_btc', new BN(50), 0.5);

        expect(gem.gemPayload.values['crypto_btc']).toEqual(new BN(125));
        expect(gem.gemPayload.values['crypto_eth']).toEqual(new BN(50));
    });
}
