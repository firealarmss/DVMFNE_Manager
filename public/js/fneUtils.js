function formatFrequency(freqHz) {
    const freqMHz = freqHz / 1e6;
    return `${freqMHz.toFixed(4)} MHz`;
}

document.addEventListener('DOMContentLoaded', (event) => {
    const frequencyElements = document.querySelectorAll('[data-frequency]');

    frequencyElements.forEach(element => {
        const frequency = element.getAttribute('data-frequency');

        element.textContent = formatFrequency(frequency);
    });
});