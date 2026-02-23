import Navigation from "../components/navigation/navigation.js";
import GenericView from "./GenericView.js";
import optionsViewTemplate from "./templates/options.view.template.js";

export default class OptionsView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view', 'options-view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'options-view-container');
        this.view.append(this.container);
        this.container.innerHTML = optionsViewTemplate;

        // this.container.addEventListener('click', (event) => {
        //     if (event.target.matches('#options-export-data-button')) {
                
        //     };
        // });
    };

    async init (meta) {
        this.app.innerHTML = '';
        this.app.append(this.view);
    };
};