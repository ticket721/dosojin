import BN from "bn.js";
import {anything, instance, mock, reset, spy, when} from "ts-mockito";
import {
    Dosojin,
    Gem
} from '../../core';
import {SimpleReceptacleMock} from "../../mocks/receptacle/SimpleReceptacleMock";

export function set_receptacle_entity_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;
    let receptacle: SimpleReceptacleMock;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({});

        dosojin = instance(mockDosojin);

        receptacle = new SimpleReceptacleMock('receptacle', dosojin);
    });

    test('throw error when action type is not \'transfer\'', async () => {
        gem.setActionType('operation');

        await expect(gem.setReceptacleEntity('dosojin', receptacle)).rejects.toThrow();
        await expect(gem.setReceptacleEntity('dosojin', receptacle)).rejects.toMatchObject({
            message: 'Invalid actionType for setReceptacleEntity call (operation instead of transfer)'
        });
    });

    test('throw error when receptacle scope list is not compatible', async () => {
        gem.setPayloadValues({'scope': new BN(1)});

        const expectedName: string = 'receptacle';
        const expectedScopes: string[] = ['invalid_scope'];
        const spiedGem: Gem = spy(gem);
        const spiedReceptacle: SimpleReceptacleMock = spy(receptacle);

        when(spiedGem.checkScopesCompatibility(expectedScopes)).thenReturn(false);

        when(spiedReceptacle.scopes(gem)).thenResolve(expectedScopes);

        await expect(gem.setReceptacleEntity('dosojin', receptacle)).rejects.toThrow();
        await expect(gem.setReceptacleEntity('dosojin', receptacle)).rejects.toMatchObject({
            message: `Incompatible scopes with entity ${expectedName}: got ${expectedScopes} expected to match ${['scope']}`
        });
    });

    test('set dosojin and entity names when scopes are compatible', async () => {
        const expectedDosojin: string = 'dosojin';
        const expectedName: string = 'receptacle';
        const spiedGem: Gem = spy(gem);

        when(spiedGem.checkScopesCompatibility(anything())).thenReturn(true);

        await gem.setReceptacleEntity(expectedDosojin, receptacle);

        expect(gem.transferStatus.receptacle).toMatchObject({
            dosojin: expectedDosojin,
            name: expectedName
        });
    });
}