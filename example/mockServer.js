const http = require("http");
const {testTrack} = require("./example");
const server = http.createServer();

server.on("request", (req, res) => {
    const url = req.url;
    switch (url) {
        case "/":
            track(res);
            break;
        default:
            res.end("ok " + process.pid);
    }
});

const port = 1234;
server.listen(port, () => {
    console.log(`server start! http://localhost:${port}`);
});

function track(res) {
    testTrack();
    res.end("track " + process.pid);
}
