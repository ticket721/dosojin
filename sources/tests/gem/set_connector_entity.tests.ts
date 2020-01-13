import BN from 'bn.js';
import {anything, instance, mock, reset, spy, when} from 'ts-mockito';
import {
    Dosojin,
    Gem,
} from '../../core';
import {SimpleConnectorMock} from '../../mocks/connector/SimpleConnectorMock';

export function set_connector_entity_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    let connector: SimpleConnectorMock;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({});

        dosojin = instance(mockDosojin);

        connector = new SimpleConnectorMock('connector', dosojin);
    });

    test('throw error when action type is not \'transfer\'', async () => {
        gem.setActionType('operation');

        await expect(gem.setConnectorEntity('dosojin', connector)).rejects.toThrow();
        await expect(gem.setConnectorEntity('dosojin', connector)).rejects.toMatchObject({
            message: 'Invalid actionType for setConnectorEntity call (operation instead of transfer)',
        });
    });

    test('throw error when connector scope list is not compatible', async () => {
        gem.setPayloadValues({'scope': new BN(1)});

        const expectedName: string = 'connector';
        const expectedScopes: string[] = ['invalid_scope'];
        const spiedGem: Gem = spy(gem);
        const spiedConnector: SimpleConnectorMock = spy(connector);

        when(spiedGem.checkScopesCompatibility(expectedScopes)).thenReturn(false);

        when(spiedConnector.scopes(gem)).thenResolve(expectedScopes);

        await expect(gem.setConnectorEntity('dosojin', connector)).rejects.toThrow();
        await expect(gem.setConnectorEntity('dosojin', connector)).rejects.toMatchObject({
            message: `Incompatible scopes with entity ${expectedName}: got ${expectedScopes} expected to match ${['scope']}`,
        });
    });

    test('set dosojin and entity names when scopes are compatible', async () => {
        const expectedDosojin: string = 'dosojin';
        const expectedName: string = 'connector';
        const spiedGem: Gem = spy(gem);

        when(spiedGem.checkScopesCompatibility(anything())).thenReturn(true);

        await gem.setConnectorEntity(expectedDosojin, connector);

        expect(gem.transferStatus.connector).toMatchObject({
            dosojin: expectedDosojin,
            name: expectedName,
        });
    });
}
