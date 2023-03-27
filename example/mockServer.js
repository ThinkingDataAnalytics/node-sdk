const http = require("http");
const server = http.createServer();

server.on("request", (req, res) => {
    const url = req.url;
    switch (url) {
        case "/test":
            track(res);
            break;
        default:
            res.end("ok " + process.pid);
    }
});

server.listen(1234, () => {
    console.log("server start!");
});

function track(res) {
    res.end("track " + process.pid);
}
