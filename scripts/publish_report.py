#!/usr/bin/env python3
"""
SwingSignal Report Publisher

This script automates the process of publishing a new trading signal report.
It copies the JSON file to the reports directory, updates latest.json,
and refreshes the archive page.

Usage:
    python scripts/publish_report.py path/to/SwingSignal_Report_YYYY-MM-DD.json
"""

import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path


def validate_json_structure(data):
    """Validate that the JSON has the required structure.
    
    Supports two formats:
    - Original: report_metadata (with generated_date), signals with symbol/action/score/trade_setup
    - New: meta (with generated_at), signals with ticker/signal/analysis.tradeSetup
    """
    errors = []
    
    # Check metadata - accept either 'report_metadata' or 'meta'
    has_metadata = 'report_metadata' in data or 'meta' in data
    if not has_metadata:
        errors.append("Missing 'report_metadata' or 'meta' field")
    else:
        meta = data.get('report_metadata') or data.get('meta')
        # Check for either date field format
        has_date = 'generated_date' in meta or 'generated_at' in meta
        if not has_date:
            errors.append("Missing date field (generated_date or generated_at)")
        if 'total_signals' not in meta:
            errors.append("Missing 'total_signals' in metadata")
    
    # Check signals
    if 'signals' not in data:
        errors.append("Missing 'signals' array")
    elif not isinstance(data['signals'], list):
        errors.append("'signals' must be an array")
    elif len(data['signals']) > 0:
        signal = data['signals'][0]
        # Check for either format of required fields
        has_symbol = 'symbol' in signal or 'ticker' in signal
        has_action = 'action' in signal or 'signal' in signal
        has_trade_setup = 'trade_setup' in signal or ('analysis' in signal and 'tradeSetup' in signal.get('analysis', {}))
        
        if not has_symbol:
            errors.append("Signal missing required field: 'symbol' or 'ticker'")
        if not has_action:
            errors.append("Signal missing required field: 'action' or 'signal'")
        if not has_trade_setup:
            errors.append("Signal missing required field: 'trade_setup' or 'analysis.tradeSetup'")
        # Note: 'score' is now optional (can use analysis.confidenceScore instead)
    
    return errors


def get_metadata(data):
    """Extract metadata from either format."""
    meta = data.get('report_metadata') or data.get('meta')
    
    # Get date - handle both formats
    date_str = meta.get('generated_date')
    if not date_str and 'generated_at' in meta:
        # Parse ISO format to YYYY-MM-DD
        generated_at = meta['generated_at']
        # Handle ISO format like "2025-12-28T06:29:37.692Z"
        date_str = generated_at.split('T')[0]
    
    signal_count = meta.get('total_signals', 0)
    
    return date_str, signal_count


def format_date_display(date_str):
    """Convert YYYY-MM-DD to a display format like 'December 24, 2025'."""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%B %d, %Y')
    except ValueError:
        return date_str


def update_archive_html(archive_path, date_str, signal_count):
    """Add a new entry to the archive.html file."""
    with open(archive_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    display_date = format_date_display(date_str)
    
    # Create new archive item
    new_item = f'''                    <a href="index.html?date={date_str}" class="archive-item" data-date="{date_str}">
                        <div>
                            <div class="archive-date">{display_date}</div>
                            <div class="archive-meta">
                                <span>{signal_count} signals</span>
                            </div>
                        </div>
                        <span class="archive-arrow">→</span>
                    </a>'''
    
    # Check if this date already exists
    if f'data-date="{date_str}"' in content:
        # Update existing entry
        pattern = rf'<a href="index\.html\?date={date_str}"[^>]*class="archive-item"[^>]*>.*?</a>'
        content = re.sub(pattern, new_item, content, flags=re.DOTALL)
        print(f"  ✓ Updated existing archive entry for {date_str}")
    else:
        # Insert new entry after the marker
        marker = '<!-- ARCHIVE_ITEMS_START -->'
        if marker in content:
            content = content.replace(
                marker,
                f'{marker}\n{new_item}'
            )
            print(f"  ✓ Added new archive entry for {date_str}")
        else:
            print("  ⚠ Warning: Could not find archive marker in archive.html")
    
    with open(archive_path, 'w', encoding='utf-8') as f:
        f.write(content)


def publish_report(json_path):
    """Main function to publish a report."""
    # Get the script's directory and project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    reports_dir = project_root / 'reports'
    archive_path = project_root / 'archive.html'
    
    print("\n📊 SwingSignal Report Publisher")
    print("=" * 40)
    
    # Validate input file exists
    json_path = Path(json_path)
    if not json_path.exists():
        print(f"❌ Error: File not found: {json_path}")
        sys.exit(1)
    
    print(f"\n📄 Input file: {json_path.name}")
    
    # Load and validate JSON
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON - {e}")
        sys.exit(1)
    
    # Validate structure
    errors = validate_json_structure(data)
    if errors:
        print("❌ Validation errors:")
        for error in errors:
            print(f"   - {error}")
        sys.exit(1)
    
    print("  ✓ JSON structure validated")
    
    # Extract metadata (supports both formats)
    date_str, signal_count = get_metadata(data)
    
    print(f"  ✓ Report date: {date_str}")
    print(f"  ✓ Signal count: {signal_count}")
    
    # Create reports directory if needed
    reports_dir.mkdir(exist_ok=True)
    
    # Copy to dated file
    dated_file = reports_dir / f'{date_str}.json'
    shutil.copy(json_path, dated_file)
    print(f"\n📁 Saved to: reports/{date_str}.json")
    
    # Update latest.json
    latest_file = reports_dir / 'latest.json'
    shutil.copy(json_path, latest_file)
    print(f"📁 Updated: reports/latest.json")
    
    # Remove source file from root to keep it clean
    json_path.unlink()
    print(f"🗑️  Removed source file: {json_path.name}")
    
    # Update archive.html
    if archive_path.exists():
        update_archive_html(archive_path, date_str, signal_count)
    else:
        print("  ⚠ Warning: archive.html not found")
    
    # Print git commands
    print("\n" + "=" * 40)
    print("✅ Report published successfully!")
    print("\nTo deploy, run these commands:")
    print("-" * 40)
    print(f"git add .")
    print(f'git commit -m "Add report for {date_str}"')
    print("git push")
    print("-" * 40)
    print("")


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/publish_report.py <path_to_json_report>")
        print("\nExample:")
        print("  python scripts/publish_report.py SwingSignal_Report_2025-12-24.json")
        sys.exit(1)
    
    publish_report(sys.argv[1])


if __name__ == '__main__':
    main()
