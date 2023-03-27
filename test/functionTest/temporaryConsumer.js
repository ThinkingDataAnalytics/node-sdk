const _ = require("../../lib/utils");

class TemporaryConsumer {
    flush() {
    }

    add(msg, callback) {
        console.log(msg);
        this.eventData = msg;
    }

    close(callback) {

    }

    getEventData() {
        console.log("getEventData")
        return this.eventData;
    }
}

module.exports = {
    init: function () {
        return new TemporaryConsumer();
    }
}
