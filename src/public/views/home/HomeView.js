import Navigation from "../../components/navigation/navigation.js";
import router from "../../router.js";
import GenericView from "../GenericView.js";

export default class HomeView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('home-view');

        this.view.append(new Navigation());

        this.home = document.createElement('div');
        this.home.classList.add('home');
        this.view.append(this.home);

        this.messageContainer = document.createElement('div');
        this.messageContainer.classList.add('home-message-container');
        this.home.append(this.messageContainer);

        this.ipMessage = document.createElement('span');
        this.ipMessage.classList.add('home-ip-message');
        this.ipMessage.textContent = 'Servidor Iniciado en la IP Local'
        this.messageContainer.append(this.ipMessage);

        this.ipSpan = document.createElement('span');
        this.ipSpan.classList.add('home-ip-span');
        this.messageContainer.append(this.ipSpan);
    }

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        
        const infoReq = await fetch("/api/info");
        const infoRes = await infoReq.json();

        this.ipSpan.textContent =infoRes.ip;
    };
};