import { instance, mock, reset, when } from 'ts-mockito';
import { CardPaymentIntentReceptacle } from '../../../stripe_dosojin';
import { Gem } from '../../../core';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';

export function scopes_tests(): void {
    let cardPiReceptacle: CardPaymentIntentReceptacle;
    let dosojin: GenericStripeDosojin;

    const mockDosojin: GenericStripeDosojin = mock(GenericStripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');

        dosojin = instance(mockDosojin);

        cardPiReceptacle = new CardPaymentIntentReceptacle(dosojin);
    });

    test('Return all fiat on scopes call', async () => {
        const gem: Gem = instance(mockGem);

        await expect(cardPiReceptacle.scopes(gem)).resolves.toMatchObject(['fiat_*']);
    });
}
