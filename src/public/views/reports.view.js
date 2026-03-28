import AppHeader from "../components/header.js";
import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import GenericView from "./GenericView.js";
import reportsViewTemplate from "./templates/reports.view.template.js";

export default class ReportsView extends GenericView {
    constructor () {
        super();
        this.meta = null;
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'reports-view-container');
        this.view.append(this.container);
        this.header = new AppHeader('REPORTES');
        this.container.append(this.header);
        this.content = document.createElement('div');
        this.content.classList.add('reports-view-content');
        this.content.innerHTML = reportsViewTemplate;
        this.container.append(this.content);

        this.ID_INPUT_START = '#reports-input-date-start';
        this.ID_INPUT_END = '#reports-input-date-end';
        this.ID_BUTTON_UPDATE = '#reports-button-update';

        this.content.addEventListener('change', (event) => {
            console.log('test');
            const storage = JSON.parse(localStorage.getItem('report'));
            if (event.target.matches(this.ID_INPUT_START)) {
                storage.start = event.target.value;
                localStorage.setItem('report', JSON.stringify(storage));
            };
            if (event.target.matches(this.ID_INPUT_END)) {
                storage.end = event.target.value;
                localStorage.setItem('report', JSON.stringify(storage));
            };
            console.log(storage)
        });
        this.content.addEventListener('click', (event) => {
            if (event.target.matches(this.ID_BUTTON_UPDATE)) {
                this.createChart();
            };
        });
    };

    async createChart () {
        if (this.chart) this.chart.destroy();

        const { labels, values } = await this.fetchOrders();

        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: labels, // ['2026-03-01', '2026-03-02', ...]
                datasets: [{
                    label: 'Ventas del día ($)',
                    data: values,   // [4500, 3200, ...]
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Rendimiento de Ventas'
                    }
                }
            }
        });
    };

    async init (meta) {
        this.meta = meta;
        this.app.innerHTML = '';
        this.app.append(this.view);

        this.canvas = document.querySelector('#reports-view-canvas');

        localStorage.setItem('report', JSON.stringify({
            type: 'orders-prices',
            start: '',
            end: ''
        }));

        this.createChart();
    };

    async fetchOrders () {
        try {
            const storage = JSON.parse(localStorage.getItem('report'));
            const resource = `/api/orders/report?type=${storage.type}&start=${storage.start}&end=${storage.end}`;
            const request = await fetch(resource, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
            return { values: [], labels: [] };
        };
    };
};