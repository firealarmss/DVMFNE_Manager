const fneConnectionState = Object.freeze({
    0: "Waiting Connection",
    1: "Waiting Login",
    2: "Waiting Auth",
    3: "Waiting Config",
    4: "Running",
    5: "RPTL Received",
    6: "Challenge Sent",
    7: "MST Running",
    0x7FFFFFF: "NET_STAT_INVALID"
});

module.exports = fneConnectionState;