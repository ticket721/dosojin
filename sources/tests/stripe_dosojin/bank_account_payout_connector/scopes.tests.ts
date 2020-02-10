import { instance, mock, reset, when } from 'ts-mockito';
import { BankAccountPayoutConnector } from '../../../stripe_dosojin';
import { Gem } from '../../../core';
import { GenericStripeDosojin } from '../../../stripe_dosojin/GenericStripeDosojin';

export function scopes_tests(): void {
    let bankAccountPoConnector: BankAccountPayoutConnector;
    let dosojin: GenericStripeDosojin;

    const mockDosojin: GenericStripeDosojin = mock(GenericStripeDosojin);
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
