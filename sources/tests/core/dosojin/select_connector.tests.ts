import { instance, mock, reset, verify } from 'ts-mockito';
import { Connector, Dosojin, Gem } from '../../../core';

export function select_connector_tests(): void {
    let dosojin: Dosojin;
    let dosojinName: string;
    const mockConnector: Connector = mock(Connector);
    const mockGem: Gem = mock(Gem);

    beforeEach(() => {
        reset(mockGem);

        dosojinName = 'dosojinName';
        dosojin = new Dosojin(dosojinName);
    });

    test('throw dosojin error when dosojin has no connector', async () => {
        const gem: Gem = instance(mockGem);

        await expect(dosojin.selectConnector(gem)).rejects.toThrow();
        await expect(dosojin.selectConnector(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `trying to select Connector, but Dosojin does not contain any`,
            name: 'DosojinError',
        });
    });

    test('throw dosojin error when dosojin contains more than one connector (default behavior)', async () => {
        const connector: Connector = instance(mockConnector);

        dosojin.addConnector(connector);
        dosojin.addConnector(connector);

        const gem: Gem = instance(mockGem);

        await expect(dosojin.selectConnector(gem)).rejects.toThrow();
        await expect(dosojin.selectConnector(gem)).rejects.toMatchObject({
            dosojin: dosojinName,
            message: `trying to select Connector, but Dosojin contains more than one. Override selectConnector method to provide custom selection.`,
            name: 'DosojinError',
        });
    });

    test('set connector entity on gem when dosojin contain exactly one connector (default behavior)', async () => {
        const connector: Connector = instance(mockConnector);

        dosojin.addConnector(connector);

        const gem: Gem = instance(mockGem);

        await dosojin.selectConnector(gem);

        verify(mockGem.setConnectorEntity(dosojinName, connector));
    });
}
