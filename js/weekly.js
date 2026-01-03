// SwingSignal AI - Weekly Signals JavaScript

// Get date from URL query parameter if present
function getWeeklyReportPath() {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    if (date) {
        return `reports/weekly/${date}.json`;
    }
    return 'reports/weekly/latest.json';
}

// Configuration
const CONFIG = {
    dataPath: getWeeklyReportPath(),
    animationDelay: 100
};

// DOM Elements
const elements = {
    reportTitle: document.getElementById('report-title'),
    reportDate: document.getElementById('report-date'),
    totalSignals: document.getElementById('total-signals'),
    buySignals: document.getElementById('buy-signals'),
    sellSignals: document.getElementById('sell-signals'),
    signalsContainer: document.getElementById('signals-container')
};

// Fetch and display the weekly report
async function loadReport() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error('Report not found');
        }
        const data = await response.json();
        renderReport(data);
    } catch (error) {
        console.error('Error loading report:', error);
        showError();
    }
}

// Render the complete report
function renderReport(data) {
    // Update metadata - support both formats
    const meta = data.report_metadata || data.meta;
    if (meta) {
        elements.reportTitle.textContent = 'Weekly Signals';

        // Handle both date formats
        let dateStr = meta.generated_date;
        if (!dateStr && meta.generated_at) {
            dateStr = meta.generated_at.split('T')[0];
        }
        elements.reportDate.textContent = `Week of ${formatDate(dateStr)}`;

        elements.totalSignals.textContent = meta.total_signals || data.signals?.length || 0;
    }

    // Count buy/sell signals
    const buyCount = data.signals?.filter(s => {
        const action = (s.action || s.signal || '').toUpperCase();
        return action === 'BUY';
    }).length || 0;

    const sellCount = data.signals?.filter(s => {
        const action = (s.action || s.signal || '').toUpperCase();
        return action === 'SELL';
    }).length || 0;

    elements.buySignals.textContent = buyCount;
    elements.sellSignals.textContent = sellCount;

    // Render signal cards
    renderSignals(data.signals || []);
}

// Render all signal cards
function renderSignals(signals) {
    if (!signals.length) {
        elements.signalsContainer.innerHTML = `
            <div class="empty-state">
                <p>No weekly signals available.</p>
            </div>
        `;
        return;
    }

    elements.signalsContainer.innerHTML = '';

    signals.forEach((signal, index) => {
        const card = createSignalCard(signal);
        card.style.animationDelay = `${index * CONFIG.animationDelay}ms`;
        elements.signalsContainer.appendChild(card);
    });
}

// Create a single signal card
function createSignalCard(signal) {
    const card = document.createElement('div');

    const action = signal.action || signal.signal || 'BUY';
    const actionClass = action.toLowerCase();
    card.className = `signal-card ${actionClass}`;

    const setup = signal.trade_setup || signal.analysis?.tradeSetup || {};
    const symbolName = signal.symbol || signal.ticker || 'N/A';
    const price = signal.reference_price || signal.price;
    const score = signal.score || signal.analysis?.confidenceScore || 'N/A';

    let analysisText = 'No analysis available.';
    if (typeof signal.analysis === 'string') {
        analysisText = signal.analysis;
    } else if (signal.analysis?.reasoning) {
        analysisText = signal.analysis.reasoning;
    }

    card.innerHTML = `
        <div class="signal-header">
            <div class="signal-info">
                <div class="signal-symbol">${escapeHtml(symbolName)}</div>
                <div class="signal-price">Ref: ₹${formatNumber(price)}</div>
            </div>
            <div class="signal-badges">
                <span class="action-badge ${actionClass}">${escapeHtml(action)}</span>
                <span class="score-badge">
                    <span>⭐</span>
                    <span>${escapeHtml(String(score))}</span>
                </span>
            </div>
        </div>
        
        <div class="trade-setup">
            <div class="setup-grid">
                <div class="setup-item">
                    <div class="setup-label">Entry</div>
                    <div class="setup-value entry">${formatSetupValue(setup.entry || setup.entryZone)}</div>
                </div>
                <div class="setup-item">
                    <div class="setup-label">Stop Loss</div>
                    <div class="setup-value stop">${formatSetupValue(setup.stop || setup.stopLoss)}</div>
                </div>
                <div class="setup-item">
                    <div class="setup-label">Target</div>
                    <div class="setup-value target">${formatSetupValue(setup.target || setup.targetPrice)}</div>
                </div>
            </div>
        </div>
        
        <div class="signal-analysis">
            <button class="analysis-toggle" onclick="toggleAnalysis(this)">
                <span>View Analysis</span>
                <span class="icon">▼</span>
            </button>
            <div class="analysis-content">
                <div class="analysis-text">${escapeHtml(analysisText)}</div>
            </div>
        </div>
    `;

    return card;
}

// Toggle analysis visibility
function toggleAnalysis(button) {
    button.classList.toggle('active');
    const content = button.nextElementSibling;
    content.classList.toggle('show');

    const span = button.querySelector('span:first-child');
    span.textContent = content.classList.contains('show') ? 'Hide Analysis' : 'View Analysis';
}

// Format date string
function formatDate(dateStr) {
    if (!dateStr) return 'This Week';

    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return Number(num).toLocaleString('en-IN');
}

// Format setup value
function formatSetupValue(value) {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
        return formatNumber(value);
    }
    return escapeHtml(String(value));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error state
function showError() {
    elements.signalsContainer.innerHTML = `
        <div class="empty-state">
            <p>Unable to load weekly signals. Please try again later.</p>
        </div>
    `;
    elements.reportDate.textContent = 'Error loading report';
}

// Initialize
document.addEventListener('DOMContentLoaded', loadReport);
