import ErrorView from "./views/error/ErrorView.js";
import HomeView from "./views/home/HomeView.js";
import ScannerView from "./views/scanner/ScannerView.js";
import DatabaseView from "./views/database/DatabaseView.js";
import NewProductView from "./views/new-product/NewProductView.js";
import PriceListsView from "./views/price-lists/PriceListsView.js";
import ProductsView from "./views/products.view.js";
import ProductView from "./views/product.view.js";

import CustomersCreateView from "./views/customers.create.view.js";
import OrdersCreateView from "./views/orders.create.view.js";
import OrdersView from "./views/orders.view.js";
import OrderView from "./views/order.view.js";

class Router {
    constructor () {
        this.router = new Navigo("/", { hash: true });
        this.event = new Event('pathnamechange');

        this.views = {
            home: new HomeView(),
            scanner: new ScannerView(),
            database: new DatabaseView(),
            newProduct: new NewProductView(),
            priceLists: new PriceListsView(),
            products: new ProductsView(),
            product: new ProductView(),
            customers_create: new CustomersCreateView(),
            orders_create: new OrdersCreateView(),
            orders: new OrdersView(),
            order: new OrderView(),
            error: new ErrorView(),
            // tc: new TermsConditionsView(),
            // landing: new LandingView(),
            // verify: new VerifyView(),
            // home: new HomeView(),
            // settings: new SettingsView(),
            // notifications: new NotificationsView(),
            // chat: new ChatView(),
            // chats: new ChatsView(),
            // startChat: new StartChatView(),
            // member: new MemberView(),
            // followed: new FollowedView(),
            // followers: new FollowersView(),
            // admin: new AdminView(),
            // post: new CommentsView(),
            // signup: new SignupView(),
            // signin: new SigninView(),
            // activate: new ActivateView(),
            // recoverPassword: new RecoverPasswordView(),
            // recoverUsername: new RecoverUsernameView(),
            // resetPassword: new ResetPasswordView(),
            // account: new AccountView(),
            // security: new SecurityView(),
            // username: new UsernameView(),
            // password: new PasswordView(),
            // sessions: new SessionsView(),
            // explore: new ExploreView()
        };

        this.router
            .on("/", () => this.views.home.init())
            .on("/scanner", () => this.views.scanner.init())
            .on('/database', () => this.views.database.init())
            .on('/new-product', () => this.views.newProduct.init())
            .on('/price-lists', () => this.views.priceLists.init())
            .on('/products', () => this.views.products.init())
            .on('/products/:id', ({ data }) => this.views.product.init(data))
            .on('/new-customer', () => this.views.customers_create.init())
            .on('/new-order', () => this.views.orders_create.init())
            .on('/orders', () => this.views.orders.init())
            .on('/orders/:id', ({ data }) => this.views.order.init(data))
            // .on("/home", () => this.views.home.init())
            // .on("/explore", ({ data, params }) => this.views.explore.init(data, params))
            // .on("/settings", () => this.views.settings.init())
            // .on("/settings/account", () => this.views.account.init())
            // .on("/settings/account/username", () => this.views.username.init())
            // .on("/settings/security", () => this.views.security.init())
            // .on("/settings/security/password", () => this.views.password.init())
            // .on("/settings/security/sessions", () => this.views.sessions.init())
            // .on("/member/:username", ({ data }) => this.views.member.init(data))
            // .on("/member/:username/followed", ({ data }) => this.views.followed.init(data))
            // .on("/member/:username/followers", ({ data }) => this.views.followers.init(data))
            // .on("/admin", () => this.views.admin.init())
            // .on("/post/:id_post/comments", ({ data }) => this.views.post.init(data))
            // .on("/chats", () => this.views.chats.init())
            // .on('/chats/start-chat', () => this.views.startChat.init())
            // .on("/chats/member/:username", ({ data }) => this.views.chat.init(data))
            // .on("/notifications", () => this.views.notifications.init())
            // .on("/signup", () => this.views.signup.init())
            // .on("/signin", () => this.views.signin.init())
            // .on("/verify", ({ data, params }) => this.views.verify.init(data, params))
            // .on("/recovery/activate", () => this.views.activate.init())
            // .on("/recovery/password", () => this.views.recoverPassword.init())
            // .on("/recovery/username", () => this.views.recoverUsername.init())
            // .on("/recovery/reset-password", ({ data, params }) => this.views.resetPassword.init(data, params))
            // .on("/terms-and-conditions", () => this.views.tc.init())
            .notFound(() => this.views.error.init());
    }

    resolve = () => {
        this.router.resolve();
    };

    navigateTo = (url) => {
        if (url == window.location.pathname) return;
        window.history.pushState(null, null, url);
        window.dispatchEvent(this.event);
        this.resolve();
    };

    replace = (url) => {
        if (url == window.location.pathname) return;
        window.history.replaceState(null, null, url);
        window.dispatchEvent(this.event);
        this.resolve();
    };

    goBack = () => {
        window.history.back();
    };

    goForward = () => {
        window.history.forward();
    };

    getPathname = () => {
        return window.location.pathname;
    };

    reload = () => {
        window.location.reload();
    };
};

export default new Router();