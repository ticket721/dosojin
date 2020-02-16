import {instance, mock, reset, spy, verify, when} from 'ts-mockito';
import {
    Dosojin,
    DosojinError,
    Gem,
} from '../../../core';

export function run_tests(): void {
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

        await expect(dosojin.run(gem, false)).rejects.toThrow();
        await expect(dosojin.run(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `received Gem with invalid actionType ${gem.actionType}`,
            name: 'DosojinError',
        });
    });

    test('throw Dosojin error when run Operation failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        const spiedDosojin: Dosojin = spy(dosojin);

        when(spiedDosojin.runOperation(gem, false)).thenThrow(new DosojinError(dosojinName, `operation failed`));

        await expect(dosojin.run(gem, false)).rejects.toThrow();
        await expect(dosojin.run(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: 'operation failed',
            name: 'DosojinError',
        });
    });

    test('throw Dosojin error when run Transfer failed', async () => {
        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        const spiedDosojin: Dosojin = spy(dosojin);
        when(spiedDosojin.runTransfer(gem, false)).thenThrow(new DosojinError(dosojinName, `transfer failed`));

        await expect(dosojin.run(gem, false)).rejects.toThrow();
        await expect(dosojin.run(gem, false)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: 'transfer failed',
            name: 'DosojinError',
        });
    });

    test('Call run operation once when actionType is operation', async () => {
        const spiedDosojin: Dosojin = spy(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('operation');

        when(spiedDosojin.runOperation(gem, false)).thenResolve(instance(mockGem));

        await dosojin.run(gem, false);

        verify(spiedDosojin.runOperation(gem, false)).once();
    });

    test('Call run transfer once when actionType is transfer', async () => {
        const spiedDosojin: Dosojin = spy(dosojin);

        const gem: Gem = instance(mockGem);
        when (mockGem.actionType).thenReturn('transfer');

        when(spiedDosojin.runTransfer(gem, false)).thenResolve(instance(mockGem));

        await dosojin.run(gem, false);

        verify(spiedDosojin.runTransfer(gem, false)).once();
    });
}
