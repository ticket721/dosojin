import {Gem, TransferConnectorStatusNames} from '../../core';

export function set_connector_status_tests(): void {
    let gem: Gem;

    beforeEach(() => {
        gem = new Gem({});
    });

    test('throw error when action type is not \'transfer\'', () => {
        gem.setActionType('operation');

        try {
            expect(gem.setConnectorStatus(TransferConnectorStatusNames.ReadyForTransfer)).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'Invalid actionType for setConnectorStatus call (operation instead of transfer)',
            });
        }
    });

    test('set status when action type is \'transfer\'', () => {
        const expectedStatus: TransferConnectorStatusNames = TransferConnectorStatusNames.ReadyForTransfer;

        gem.setConnectorStatus(expectedStatus);

        expect(gem.transferStatus.connector).toMatchObject({
            status: expectedStatus,
        });
    });
}
