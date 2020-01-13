import {instance, mock, reset, spy, verify, when} from 'ts-mockito';
import {
    Dosojin,
    DosojinError,
    Gem,
} from '../../core';

export function dry_run_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);
        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw Dosojin error when gem actionType is null', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn(null);

        await expect(dosojin.dryRun(gem)).rejects.toThrow();
        await expect(dosojin.dryRun(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'DosojinError',
        });
    });

    test('throw Dosojin error when dry run Operation failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const spiedDosojin: Dosojin = spy(dosojin);

        when(spiedDosojin.dryRunOperation(gem)).thenThrow(new DosojinError(dosojinName, `operation failed`));

        await expect(dosojin.dryRun(gem)).rejects.toThrow();
        await expect(dosojin.dryRun(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: 'operation failed',
            name: 'DosojinError',
        });
    });

    test('throw Dosojin error when dry run Transfer failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const spiedDosojin: Dosojin = spy(dosojin);
        when(spiedDosojin.dryRunTransfer(gem)).thenThrow(new DosojinError(dosojinName, `transfer failed`));

        await expect(dosojin.dryRun(gem)).rejects.toThrow();
        await expect(dosojin.dryRun(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: 'transfer failed',
            name: 'DosojinError',
        });
    });

    test('Call dry run operation once when actionType is operation', async () => {
        const spiedDosojin: Dosojin = spy(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        when(spiedDosojin.dryRunOperation(gem)).thenResolve(instance(mockGem));

        await dosojin.dryRun(gem);

        verify(spiedDosojin.dryRunOperation(gem)).once();
    });

    test('Call dry run transfer once when actionType is transfer', async () => {
        const spiedDosojin: Dosojin = spy(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        when(spiedDosojin.dryRunTransfer(gem)).thenResolve(instance(mockGem));

        await dosojin.dryRun(gem);

        verify(spiedDosojin.dryRunTransfer(gem)).once();
    });
}
