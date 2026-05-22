import GenericView from "./generic.view.js";

export default class PageManage extends GenericView {
    constructor () {
        super();
    };

    async init (meta) {
        this.meta = meta;
    };
};