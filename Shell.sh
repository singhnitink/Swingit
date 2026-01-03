#!/bin/bash

# Initialize conda for this script
source ~/anaconda3/etc/profile.d/conda.sh  # or ~/miniconda3/etc/profile.d/conda.sh
conda activate tradingweb

# Uncomment the one you need:
#python scripts/publish_report.py nifty500_signals_20260103_162513.json
python scripts/publish_weekly.py SwingSignal_Data_2026-01-03.json

git add .
git commit -m "Report $(date +'%B %d, %Y')"
git push