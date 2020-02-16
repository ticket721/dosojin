import BN from 'bn.js';
import { Gem } from '../../../core';

export function update_payload_value_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({fiat_eur: new BN(10), fiat_usd: new BN(5)});
    });

    test('throw error when specified scope does not exist on gem payload', () => {
        try {
            expect(gem.updatePayloadValue('crypto_eth', 20)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'The scope crypto_eth does not exist on gem payload'
            });
        }
    });

    test('update a value with number parameter', () => {
        gem.updatePayloadValue('fiat_eur', 20);

        expect(gem.gemPayload.values['fiat_eur']).toEqual(new BN(20));
    });

    test('update a value with BN parameter', () => {
        gem.updatePayloadValue('fiat_eur', new BN(20));

        expect(gem.gemPayload.values['fiat_eur']).toEqual(new BN(20));
    });
}
