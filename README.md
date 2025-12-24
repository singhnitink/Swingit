# SwingSignal AI - Trading Signals Website

A premium dark-themed website to publish daily trading signal reports.

## Quick Start

### Daily Update Workflow

**Step 1**: Generate your JSON report in this format:
```json
{
    "report_metadata": {
        "title": "SwingSignal AI - Confirmed Opportunities",
        "generated_date": "YYYY-MM-DD",
        "generated_time": "HH:MM:SS",
        "total_signals": <number>
    },
    "signals": [
        {
            "id": 1,
            "symbol": "TICKER.NS",
            "action": "BUY",
            "score": "85%",
            "reference_price": 123.45,
            "trade_setup": {
                "entry": "120.00 - 125.00",
                "stop": 115.00,
                "target": "140.00"
            },
            "analysis": "Your detailed analysis text..."
        }
    ]
}
```

**Step 2**: Run the publish script:
```bash
conda activate tradingweb
python scripts/publish_report.py SwingSignal_Report_2025-12-25.json
```

**Step 3**: Push to GitHub:
```bash
git add .
git commit -m "Add report for 2025-12-25"
git push
```

Your website will update automatically within 1-2 minutes!

---

## Local Development

To preview locally:
```bash
python -m http.server 8080
# Open http://localhost:8080
```

---

## GitHub Pages Setup

1. Go to your repo → **Settings** → **Pages**
2. Set Source to **Deploy from a branch**
3. Select **main** branch, **/ (root)**
4. Click **Save**

Your site will be live at: `https://yourusername.github.io/trading_signal_web`

---

## Project Structure

```
trading_signal_web/
├── index.html          # Homepage showing latest signals
├── archive.html        # Historical reports
├── css/style.css       # Premium dark theme
├── js/app.js           # Signal card rendering
├── reports/
│   ├── latest.json     # Current day's report
│   └── YYYY-MM-DD.json # Archived reports
└── scripts/
    └── publish_report.py  # Daily update script
```

---

## JSON Format Reference

| Field | Type | Description |
|-------|------|-------------|
| `report_metadata.generated_date` | String | Format: YYYY-MM-DD |
| `report_metadata.total_signals` | Number | Count of signals |
| `signals[].symbol` | String | Ticker symbol |
| `signals[].action` | String | "BUY" or "SELL" |
| `signals[].score` | String | Confidence score (e.g., "85%") |
| `signals[].reference_price` | Number | Current price |
| `signals[].trade_setup.entry` | String/Number | Entry price range |
| `signals[].trade_setup.stop` | Number | Stop loss price |
| `signals[].trade_setup.target` | String/Number | Target price range |
| `signals[].analysis` | String | Detailed analysis text |
