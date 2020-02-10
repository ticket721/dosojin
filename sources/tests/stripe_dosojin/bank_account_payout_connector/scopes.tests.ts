import { instance, mock, reset, when } from 'ts-mockito';
import { BankAccountPayoutConnector } from '../../../stripe_dosojin';
import { Gem } from '../../../core';
import { StripeDosojin } from '../../../stripe_dosojin/StripeDosojin';

export function scopes_tests(): void {
    let bankAccountPoConnector: BankAccountPayoutConnector;
    let dosojin: StripeDosojin;

    const mockDosojin: StripeDosojin = mock(StripeDosojin);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        reset(mockDosojin);

        when(mockDosojin.name).thenReturn('dosojinName');

        dosojin = instance(mockDosojin);

        bankAccountPoConnector = new BankAccountPayoutConnector(dosojin);
    });

    test('Return all fiat on scopes call', async () => {
        const gem: Gem = instance(mockGem);

        await expect(bankAccountPoConnector.scopes(gem)).resolves.toMatchObject(['fiat_*']);
    });
}
