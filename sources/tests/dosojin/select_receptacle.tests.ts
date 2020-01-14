import { instance, mock, reset, verify } from 'ts-mockito';
import {
    Dosojin,
    Gem,
    Receptacle,
} from '../../core';

export function select_receptacle_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockReceptacle: Receptacle = mock(Receptacle);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw dosojin error when dosojin has no receptacle', async () => {
        const gem: Gem = instance(mockGem);

        await expect(dosojin.selectReceptacle(gem)).rejects.toThrow();
        await expect(dosojin.selectReceptacle(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `trying to select Receptacle, but Dosojin does not contain any`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin contains more than one receptacle (default behavior)', async () => {
        const receptacle: Receptacle = instance(mockReceptacle);

        dosojin.addReceptacle(receptacle);
        dosojin.addReceptacle(receptacle);

        const gem: Gem = instance(mockGem);

        await expect(dosojin.selectReceptacle(gem)).rejects.toThrow();
        await expect(dosojin.selectReceptacle(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `trying to select Receptacle, but Dosojin contains more than one. Override selectReceptacle method to provide custom selection.`,
            name: 'DosojinError',
        });
    });

    test('set receptacle entity on gem when dosojin contain exactly one receptacle (default behavior)', async () => {
        const receptacle: Receptacle = instance(mockReceptacle);

        dosojin.addReceptacle(receptacle);

        const gem: Gem = instance(mockGem);

        await dosojin.selectReceptacle(gem);

        verify(mockGem.setReceptacleEntity(dosojinName, receptacle));
    });
}
