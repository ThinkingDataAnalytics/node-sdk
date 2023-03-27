const TE = require("../../lib/thinkingdata-node");
const TemporaryConsumer = require("./temporaryConsumer");
const {expect} = require("chai");

describe("TE SDK Core", () => {
    let consumer = TemporaryConsumer.init();
    let te = TE.initWithDebugMode('appId', 'https://thinkingdata.cn', {});
    te.consumer = consumer;

    function testTrack(params) {
        it("track", () => {
            te.track(params);
        });
        it("trackUpdate", () => {
            te.trackUpdate(params);
        });
        it("trackOverwrite", () => {
            te.trackOverWrite(params);
        });
        it("trackFirst", () => {
            te.trackFirst(params);
        });
    }

    describe("accountIdAndDistinctIdMissing", () => {
        let params = {
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("account ID and distinct ID cannot be empty at the same time");
            }
        };
        testTrack(params);
    })

    describe("accountIdMissing", () => {
        let params = {
            event: "name",
            eventId: "111",
            firstCheckId: "id_1",
            distinctId: "222",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("");
            }
        };
        testTrack(params);
    })

    describe("eventNameMissing", () => {
        let params = {
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("invalid event name");
            }
        };
        testTrack(params);
    })

    describe("eventNameEmpty", () => {
        let params = {
            event: "",
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("invalid event name");
            }
        };
        testTrack(params);
    })

    describe("eventNameError1", () => {
        let params = {
            event: "a", // string length must greater than 1
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("invalid event name");
            }
        };
        testTrack(params);
    })

    describe("eventNameError2", () => {
        let params = {
            event: "1a",
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("invalid event name");
            }
        };
        testTrack(params);
    })

    describe("eventIdMissing", () => {
        let params = {
            event: "name",
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("eventId cannot be empty");
            }
        };
        it("trackUpdate", () => {
            te.trackUpdate(params);
        });
        it("trackOverwrite", () => {
            te.trackOverWrite(params);
        });
    })

    describe("firstCheckIdMissing", () => {
        let params = {
            event: "name",
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("firstCheckId cannot be empty");
            }
        };
        it("trackFirst", () => {
            te.trackFirst(params);
        });
    })

    describe("firstCheckId", () => {
        let params = {
            event: "name",
            firstCheckId: "id_1",
            accountId: "123",
            callback: (e) => {
                console.log(e.message);
                expect(e.message).to.equal("eventId cannot be empty");
            }
        };
        it("trackFirst", () => {
            te.trackFirst(params);
        });
    })

    describe("user_property", () => {
        it("success", () => {

        })
    })

    describe("util", () => {
        it("success", () => {

        })
    })
})