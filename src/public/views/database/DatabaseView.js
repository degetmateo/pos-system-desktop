import Navigation from "../../components/navigation/navigation.js";
import GenericView from "../GenericView.js";

export default class DatabaseView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view', 'database-view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('database-container');
        this.view.append(this.container);

        this.form = document.createElement('form');
        this.form.classList.add('database-form');
        this.container.append(this.form);

        this.inputDatabaseName = document.createElement('input');
        this.inputDatabaseHost = document.createElement('input');
        this.inputDatabasePort = document.createElement('input');
        this.inputDatabaseUser = document.createElement('input');
        this.inputDatabasePass = document.createElement('input');

        this.inputDatabaseName.classList.add('database-input');
        this.inputDatabaseHost.classList.add('database-input');
        this.inputDatabasePort.classList.add('database-input');
        this.inputDatabaseUser.classList.add('database-input');
        this.inputDatabasePass.classList.add('database-input');

        this.inputDatabaseName.placeholder = 'Database Name';
        this.inputDatabaseHost.placeholder = 'Database Host';
        this.inputDatabasePort.placeholder = 'Database Port';
        this.inputDatabaseUser.placeholder = 'Database User';
        this.inputDatabasePass.placeholder = 'Database Password';

        this.inputDatabaseName.type = 'text';
        this.inputDatabaseHost.type = 'text';
        this.inputDatabasePort.type = 'text';
        this.inputDatabaseUser.type = 'text';
        this.inputDatabasePass.type = 'password';

        this.inputDatabaseName.required = true;
        this.inputDatabaseHost.required = true;
        this.inputDatabasePort.required = true;
        this.inputDatabaseUser.required = true;
        this.inputDatabasePass.required = true;

        this.form.append(this.inputDatabaseName);
        this.form.append(this.inputDatabaseHost);
        this.form.append(this.inputDatabasePort);
        this.form.append(this.inputDatabaseUser);
        this.form.append(this.inputDatabasePass);

        this.button = document.createElement('button');
        this.button.type = 'submit';
        this.button.textContent = 'Guardar Credenciales';
        this.button.classList.add('database-button');
        this.form.append(this.button);

        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.submit();
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
    };

    async submit () {
        const request = await fetch('/api/database', {
            method: 'POST',
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                database: {
                    name: this.inputDatabaseName.value,
                    host: this.inputDatabaseHost.value,
                    port: this.inputDatabasePort.value,
                    user: this.inputDatabaseUser.value,
                    pass: this.inputDatabasePass.value
                }
            })
        });

        const response = await request.json();
        console.log(response);
    };
};