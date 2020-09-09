import { instance, mock, reset, when } from 'ts-mockito';
import { Dosojin, Gem } from '../../../core';

export function set_state_tests(): void {
    let gem: Gem;
    const mockDosojin: Dosojin = mock(Dosojin);
    let dosojin: Dosojin;

    beforeEach(() => {
        reset(mockDosojin);

        gem = new Gem({});

        dosojin = instance(mockDosojin);
    });

    test('return immediately when data parameter is empty', () => {
        when(mockDosojin.name).thenReturn('dosojin');

        gem.setState(dosojin, undefined);

        expect(gem.getState(dosojin)).toBeUndefined();
    });

    test('throw error when dosojin name is null', () => {
        when(mockDosojin.name).thenReturn(null);

        try {
            expect(gem.setState(dosojin, { datum: 'value' })).toThrow();
        } catch (e) {
            expect(e).toMatchObject({
                message: 'invalid state key type: expect string | Dosojin, got object',
            });
        }
    });

    test('set state when dosojin is correctly set (as a Dosojin)', () => {
        const expectedDatum = { datum: 'value' };
        when(mockDosojin.name).thenReturn('dosojin');

        gem.setState(dosojin, expectedDatum);

        expect(gem.getState(dosojin)).toEqual(expectedDatum);
    });

    test('set state when dosojin is correctly set (as a string)', () => {
        const expectedDatum = { datum: 'value' };
        when(mockDosojin.name).thenReturn('dosojin');

        gem.setState('dosojin', expectedDatum);

        expect(gem.getState(dosojin)).toEqual(expectedDatum);
    });
}
