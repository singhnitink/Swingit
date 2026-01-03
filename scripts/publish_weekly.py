#!/usr/bin/env python3
"""
SwingSignal Weekly Report Publisher

This script automates the process of publishing a new weekly analysis report.
It copies the JSON file to the reports/weekly directory, updates latest.json,
and refreshes the archive page.

Usage:
    python scripts/publish_weekly.py path/to/WeeklyAnalysis_YYYY-MM-DD.json
"""

import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path


def validate_json_structure(data):
    """Validate that the JSON has the required structure for weekly reports."""
    errors = []
    
    # Check metadata - accept either 'report_metadata' or 'meta'
    has_metadata = 'report_metadata' in data or 'meta' in data
    if not has_metadata:
        errors.append("Missing 'report_metadata' or 'meta' field")
    else:
        meta = data.get('report_metadata') or data.get('meta')
        # Check for either date field format
        has_date = 'week_ending' in meta or 'generated_date' in meta or 'generated_at' in meta
        if not has_date:
            errors.append("Missing date field (week_ending, generated_date, or generated_at)")
    
    # Check for at least some content
    has_content = any([
        'market_overview' in data,
        'key_insights' in data,
        'top_picks' in data,
        'sector_analysis' in data,
        'outlook' in data
    ])
    
    if not has_content:
        errors.append("Missing content - need at least one of: market_overview, key_insights, top_picks, sector_analysis, outlook")
    
    return errors


def get_metadata(data):
    """Extract metadata from either format."""
    meta = data.get('report_metadata') or data.get('meta')
    
    # Get date - handle multiple formats
    date_str = meta.get('week_ending') or meta.get('generated_date')
    if not date_str and 'generated_at' in meta:
        # Parse ISO format to YYYY-MM-DD
        generated_at = meta['generated_at']
        date_str = generated_at.split('T')[0]
    
    return date_str


def format_date_display(date_str):
    """Convert YYYY-MM-DD to a display format like 'December 24, 2025'."""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%B %d, %Y')
    except ValueError:
        return date_str


def update_archive_html(archive_path, date_str):
    """Add a new entry to the archive.html weekly section."""
    with open(archive_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    display_date = format_date_display(date_str)
    
    # Create new archive item for weekly
    new_item = f'''                    <a href="weekly.html?date={date_str}" class="archive-item" data-date="{date_str}">
                        <div>
                            <div class="archive-date">Week of {display_date}</div>
                            <div class="archive-meta">
                                <span>Weekly Analysis</span>
                            </div>
                        </div>
                        <span class="archive-arrow">→</span>
                    </a>'''
    
    # Check if this date already exists in weekly section
    if f'weekly.html?date={date_str}' in content:
        # Update existing entry
        pattern = rf'<a href="weekly\.html\?date={date_str}"[^>]*class="archive-item"[^>]*>.*?</a>'
        content = re.sub(pattern, new_item, content, flags=re.DOTALL)
        print(f"  ✓ Updated existing weekly archive entry for {date_str}")
    else:
        # Insert new entry after the weekly marker
        marker = '<!-- WEEKLY_ITEMS_START -->'
        if marker in content:
            content = content.replace(
                marker,
                f'{marker}\n{new_item}'
            )
            print(f"  ✓ Added new weekly archive entry for {date_str}")
        else:
            print("  ⚠ Warning: Could not find weekly archive marker in archive.html")
    
    with open(archive_path, 'w', encoding='utf-8') as f:
        f.write(content)


def publish_weekly_report(json_path):
    """Main function to publish a weekly report."""
    # Get the script's directory and project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    weekly_dir = project_root / 'reports' / 'weekly'
    archive_path = project_root / 'archive.html'
    
    print("\n📊 SwingSignal Weekly Report Publisher")
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
    
    # Extract metadata
    date_str = get_metadata(data)
    
    print(f"  ✓ Week ending: {date_str}")
    
    # Create weekly reports directory if needed
    weekly_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy to dated file
    dated_file = weekly_dir / f'{date_str}.json'
    shutil.copy(json_path, dated_file)
    print(f"\n📁 Saved to: reports/weekly/{date_str}.json")
    
    # Update latest.json
    latest_file = weekly_dir / 'latest.json'
    shutil.copy(json_path, latest_file)
    print(f"📁 Updated: reports/weekly/latest.json")
    
    # Remove source file from root to keep it clean
    json_path.unlink()
    print(f"🗑️  Removed source file: {json_path.name}")
    
    # Update archive.html
    if archive_path.exists():
        update_archive_html(archive_path, date_str)
    else:
        print("  ⚠ Warning: archive.html not found")
    
    # Print git commands
    print("\n" + "=" * 40)
    print("✅ Weekly report published successfully!")
    print("\nTo deploy, run these commands:")
    print("-" * 40)
    print(f"git add .")
    print(f'git commit -m "Add weekly analysis for {date_str}"')
    print("git push")
    print("-" * 40)
    print("")


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/publish_weekly.py <path_to_json_report>")
        print("\nExample:")
        print("  python scripts/publish_weekly.py WeeklyAnalysis_2025-12-28.json")
        sys.exit(1)
    
    publish_weekly_report(sys.argv[1])


if __name__ == '__main__':
    main()
