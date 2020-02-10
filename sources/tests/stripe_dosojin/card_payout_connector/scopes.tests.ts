import { instance, mock, reset, when } from 'ts-mockito';
import { CardPayoutConnector } from '../../../stripe_dosojin';
import { Gem } from '../../../core';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';

export function scopes_tests(): void {
    let cardPoConnector: CardPayoutConnector;
    let dosojin: StripeDosojin;

    const mockDosojin: StripeDosojin = mock(StripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');

        dosojin = instance(mockDosojin);

        cardPoConnector = new CardPayoutConnector(dosojin);
    });

    test('Return all fiat on scopes call', async () => {
        const gem: Gem = instance(mockGem);

        await expect(cardPoConnector.scopes(gem)).resolves.toMatchObject(['fiat_*']);
    });
}
