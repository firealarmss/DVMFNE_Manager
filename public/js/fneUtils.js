const netConnectionStatus = Object.freeze({
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

function formatFrequency(freqHz) {
    const freqMHz = freqHz / 1e6;
    return `${freqMHz.toFixed(4)} MHz`;
}

document.addEventListener('DOMContentLoaded', (event) => {
    const frequencyElements = document.querySelectorAll('[data-frequency]');
    const connectionStatusElemenst = document.querySelectorAll('[data-connState]');

    connectionStatusElemenst.forEach(element => {
        const state = element.getAttribute('data-connState');
console.log(state)
        console.log(netConnectionStatus[parseInt(state)])
        element.textContent = netConnectionStatus[parseInt(state)] || state;
    });

    frequencyElements.forEach(element => {
        const frequency = element.getAttribute('data-frequency');

        element.textContent = formatFrequency(frequency);
    });
});