import {Gem, TransferReceptacleStatusNames} from '../../core';

export function set_receptacle_status_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('throw error when action type is not \'transfer\'', () => {
        gem.setActionType('operation');

        try {
            expect(gem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setReceptacleStatus call (operation instead of transfer)',
            });
        }
    });

    test('set status when action type is \'transfer\'', () => {
        const expectedStatus: TransferReceptacleStatusNames = TransferReceptacleStatusNames.ReadyForTransfer;

        gem.setReceptacleStatus(expectedStatus);

        expect(gem.transferStatus.receptacle).toMatchObject({
            status: expectedStatus,
        });
    });
}
