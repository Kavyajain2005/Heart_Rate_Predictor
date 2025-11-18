// Dark mode toggle
const darkSwitch = document.getElementById('darkModeSwitch');
darkSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
});

// File upload handler
document.getElementById('fileUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.trim().split(/\r?\n/);
        document.getElementById('inputSeq').value = lines.join(',');
    };
    reader.readAsText(file);
});

const ctx = document.getElementById('hrChart').getContext('2d');
let hrChart = null;

function initChart() {
    if (hrChart) hrChart.destroy();
    hrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 50 }, (_, i) => i + 1).concat(['Next']),
            datasets: [
                {
                    label: 'Input Heart Rate',
                    data: [],
                    borderColor: '#a3cef1',
                    backgroundColor: 'rgba(163, 206, 241, 0.4)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                },
                {
                    label: 'Predicted Next',
                    data: [],
                    borderColor: '#ff6384',
                    backgroundColor: '#ff6384',
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false,
                }
            ],
        },
        options: {
            responsive: true,
            interaction: { mode: 'nearest', intersect: true },
            scales: {
                y: {
                    min: 40,
                    max: 100,
                    title: { display: true, text: 'Heart Rate (bpm)', color: '#eee', font: { weight: 'bold' } }
                },
                x: {
                    title: { display: true, text: 'Time Step', color: '#eee', font: { weight: 'bold' } }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { color: '#eee', font: { size: 15 } } },
                tooltip: { enabled: true, backgroundColor: '#222' }
            }
        },
    });
}

function showLoading(isLoading) {
    const btn = document.getElementById('predictBtn');
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Predicting...`;
    } else {
        btn.disabled = false;
        btn.textContent = 'Predict Next Heart Rate';
    }
}

document.getElementById('predictBtn').addEventListener('click', async () => {
    showLoading(true);
    const input = document.getElementById('inputSeq').value;
    const seq = input.split(',')
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x));

    if (seq.length !== 50) {
        alert('Please enter exactly 50 heart rate values.');
        showLoading(false);
        return;
    }

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence: seq })
        });
        if (!response.ok) {
            const error = await response.json();
            alert('Error: ' + error.error);
            showLoading(false);
            return;
        }
        const { predicted_heart_rate } = await response.json();
        document.getElementById('result').textContent =
            `Predicted Next Heart Rate: ${predicted_heart_rate.toFixed(2)} bpm`;

        initChart();
        hrChart.data.datasets[0].data = seq;
        hrChart.data.datasets[1].data = Array(50).fill(null);
        hrChart.data.datasets[1].data.push(predicted_heart_rate);
        hrChart.update();

    } catch (err) {
        alert('An unexpected error occurred.');
    } finally {
        showLoading(false);
    }
});

window.onload = () => {
    initChart();
};