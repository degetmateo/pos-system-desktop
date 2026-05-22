class EndpointManager {
    async getEndpoint () {
        try {
            const req = await fetch('/api/info/data', { method: "GET" });
            const res = await req.json();
            return res.data.endpoint;
        } catch (error) {
            console.error(error);
            return null;
        };
    };
};

export default new EndpointManager();