import BN                     from 'bn.js';
import { Circuit }            from '../core/Circuit';
import { ActionError }        from '../core/errors/ActionError';
import { CircuitError }       from '../core/errors/CircuitError';
import { Gem }                from '../core/Gem';
import { SingleDosojinLayer } from '../core/SingleDosojinLayer';
import { BasicDosojinMock }   from '../mocks/dosojin/BasicDosojinMock';

export async function simple_circuit_run(): Promise<void> {

    const basicDosojin1: BasicDosojinMock = new BasicDosojinMock('1');
    const basicDosojin2: BasicDosojinMock = new BasicDosojinMock('2');

    const sdl1: SingleDosojinLayer = new SingleDosojinLayer('SingleDosojinLayerTest1');
    const sdl2: SingleDosojinLayer = new SingleDosojinLayer('SingleDosojinLayerTest2');

    const circuit: Circuit = new Circuit("main", [sdl1, sdl2]);

    sdl1.setDosojin(basicDosojin1);
    sdl2.setDosojin(basicDosojin2);

    let gem: Gem = await circuit.createGem({fiat_euro: new BN(10), fiat_usd: new BN(5)});
    while (['Complete', 'Error', 'Fatal'].indexOf(gem.gemStatus) === -1) {
        gem = await circuit.run(gem);
        // console.log(gem);
    }
    console.log(gem);


}
