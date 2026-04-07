#!/bin/bash
# Batch import Font Awesome Sharp SVGs into Figma as components
# Usage: bash scripts/batch-import-icons.sh [filter-file] [batch-size]

set -e
cd "$(dirname "$0")/.."

FILTER_FILE="${1:-/tmp/used-icons.txt}"
BATCH_SIZE="${2:-8}"
FAMILY="sharp-solid"
ICON_SIZE=16
GRID_COLS=20
GAP=24

if [ ! -f "$FILTER_FILE" ]; then
  echo "Filter file not found: $FILTER_FILE"
  exit 1
fi

ICONS=($(cat "$FILTER_FILE"))
TOTAL=${#ICONS[@]}
echo "Importing $TOTAL icons in batches of $BATCH_SIZE..."

IDX=0
BATCH_NUM=0
TOTAL_OK=0
TOTAL_ERR=0

while [ $IDX -lt $TOTAL ]; do
  BATCH_NUM=$((BATCH_NUM + 1))
  END=$((IDX + BATCH_SIZE))
  if [ $END -gt $TOTAL ]; then END=$TOTAL; fi

  BATCH=("${ICONS[@]:$IDX:$BATCH_SIZE}")
  echo -n "Batch $BATCH_NUM (icons $((IDX+1))-$END/$TOTAL)... "

  # Build JS code with inline SVGs
  JS_CODE="(async () => { const results = [];"

  for i in "${!BATCH[@]}"; do
    NAME="${BATCH[$i]}"
    SVG_FILE="icons/$FAMILY/$NAME.svg"
    if [ ! -f "$SVG_FILE" ]; then
      echo "Skip $NAME (not found)"
      continue
    fi

    SVG=$(cat "$SVG_FILE" | tr '\n' ' ')
    GLOBAL_IDX=$((IDX + i))
    COL=$((GLOBAL_IDX % GRID_COLS))
    ROW=$((GLOBAL_IDX / GRID_COLS))
    X=$((COL * GAP))
    Y=$((ROW * GAP))

    JS_CODE+="
    try {
      const n$i = figma.createNodeFromSvg(\`$SVG\`);
      n$i.resize($ICON_SIZE, $ICON_SIZE);
      n$i.x = $X; n$i.y = $Y;
      n$i.name = 'icon/$NAME';
      const c$i = figma.createComponentFromNode(n$i);
      c$i.name = 'icon/$NAME';
      results.push('ok');
    } catch(e) { results.push('err:$NAME'); }"
  done

  JS_CODE+="
  return JSON.stringify({ok: results.filter(r=>r==='ok').length, err: results.filter(r=>r!=='ok').length});
  })()"

  # Write to temp file and eval
  echo "$JS_CODE" > /tmp/batch-eval.js
  RESULT=$(node src/index.js eval "$(cat /tmp/batch-eval.js)" 2>&1) || true

  if echo "$RESULT" | grep -q '"ok"'; then
    OK=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.ok)" 2>/dev/null || echo "?")
    ERR=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.err)" 2>/dev/null || echo "?")
    echo "✓ $OK ok, $ERR errors"
    TOTAL_OK=$((TOTAL_OK + OK))
    TOTAL_ERR=$((TOTAL_ERR + ERR))
  else
    echo "✗ Failed: ${RESULT:0:100}"
    # Restart daemon and retry
    node src/index.js daemon restart 2>/dev/null || true
    sleep 2
  fi

  IDX=$END
done

echo ""
echo "Done! $TOTAL_OK created, $TOTAL_ERR errors out of $TOTAL icons."
