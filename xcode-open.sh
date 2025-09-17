#!/bin/bash
# Open Xcode workspace for Flush Frenzy

if [ -d "ios" ]; then
    if [ -f "ios/FlushFrenzy.xcworkspace" ]; then
        echo "📱 Opening Xcode workspace..."
        open ios/FlushFrenzy.xcworkspace
    else
        echo "❌ Xcode workspace not found. Run './ios-setup.sh' first."
    fi
else
    echo "❌ iOS directory not found. Run './setup-xcode.sh' first."
fi
