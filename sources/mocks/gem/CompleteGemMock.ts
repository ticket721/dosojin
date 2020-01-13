import { Gem } from '../../core';

export class CompleteGemMock extends Gem {
    constructor() {
        super({});
        this.gemStatus = 'Complete';
    }
}
