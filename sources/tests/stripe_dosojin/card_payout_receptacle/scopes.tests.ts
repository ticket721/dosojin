import { instance, mock, reset, when } from 'ts-mockito';
import { CardPayoutReceptacle } from '../../../stripe_dosojin';
import { Gem } from '../../../core';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';

export function scopes_tests(): void {
    let cardPoReceptacle: CardPayoutReceptacle;
    let dosojin: StripeDosojin;

    const mockDosojin: StripeDosojin = mock(StripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');

        dosojin = instance(mockDosojin);

        cardPoReceptacle = new CardPayoutReceptacle(dosojin);
    });

    test('Return all fiat on scopes call', async () => {
        const gem: Gem = instance(mockGem);

        await expect(cardPoReceptacle.scopes(gem)).resolves.toMatchObject(['fiat_*']);
    });
}
