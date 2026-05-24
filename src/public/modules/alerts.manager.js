import Alert from "../components/alert.js";

class AlertManager {
    constructor () {
        this.container = document.createElement('div');
        this.container.classList.add('alert-container');

        this.alerts = [];
    };

    async createAlert (message, error = false, remove = true) {
        if (this.alerts.length <= 0) document.body.append(this.container);

        const request = await fetch('/api/info/uuid', { method: "GET" });
        const response = await request.json();

        const alert = new Alert(message, error, 4000, remove, () => {
            this.alerts = this.alerts.filter((a) => a.id !== response.data);
            if (this.alerts.length <= 0) this.container.remove();
        });

        this.alerts.push({
            element: alert,
            id: response.data
        });

        this.container.append(alert.render());

        return alert;
    };
};

export default new AlertManager();