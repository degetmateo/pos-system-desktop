class FlowController {
    synchronizing = false;

    constructor () {
        this.synchronizing = false;
    };

    isSynzhronizing () {
        return this.synchronizing;
    };

    setSynchronizing (value) {
        this.synchronizing = value;
    };
};

module.exports = new FlowController();