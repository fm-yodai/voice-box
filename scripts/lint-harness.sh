#!/usr/bin/env bash
# ハーネス drift 検知: ローカル & CI 共通
# 失敗時は exit 1。ローカルでは `bash scripts/lint-harness.sh` で実行可能。

set -eu

err=0
warn=0
pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1" >&2; err=1; }
warn_msg() { echo "  ⚠ $1"; warn=$((warn+1)); }

echo "[1/6] 必須ファイル"
for f in CLAUDE.md SETUP.md .claude/settings.json docs/ADR.md; do
  [ -f "$f" ] && pass "$f" || fail "$f が存在しません"
done

echo "[2/6] settings.local.json の扱い"
if git ls-files --error-unmatch .claude/settings.local.json >/dev/null 2>&1; then
  warn_msg ".claude/settings.local.json がコミットされています（個人 permissions が増えたら .gitignore を検討）"
else
  pass ".claude/settings.local.json は未コミット"
fi

echo "[3/6] Skills 構造（SKILL.md の存在）"
for d in .claude/skills/*/; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  if [ -f "${d}SKILL.md" ]; then
    pass "skill: $name"
  else
    fail "skill: $name に SKILL.md がありません"
  fi
done

echo "[4/6] Skills frontmatter & 本文サイズ"
for d in .claude/skills/*/; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  skill="${d}SKILL.md"
  [ -f "$skill" ] || continue
  fm=$(awk '/^---$/{c++; if(c==2) exit; next} c==1' "$skill")
  echo "$fm" | grep -q "^name:" && pass "$name: name あり" || fail "$name: frontmatter に name なし"
  echo "$fm" | grep -q "^description:" && pass "$name: description あり" || fail "$name: frontmatter に description なし"
  body_lines=$(awk '/^---$/{c++; next} c>=2' "$skill" | wc -l)
  if [ "$body_lines" -gt 500 ]; then
    warn_msg "$name: SKILL.md 本文 $body_lines 行（500 行ガイドライン超過、reference 分割を検討）"
  fi
done

echo "[5/6] hook スクリプトが実行可能"
for f in scripts/hooks/*.sh; do
  [ -f "$f" ] || continue
  if [ -x "$f" ]; then
    pass "$(basename "$f")"
  else
    fail "$f が実行可能ではありません (chmod +x が必要)"
  fi
done

echo "[6/6] ADR インデックスのリンク整合性"
while IFS= read -r rel; do
  if [ -f "docs/$rel" ]; then
    pass "ADR リンク: $rel"
  else
    fail "docs/ADR.md が参照する docs/$rel が存在しません"
  fi
done < <(grep -oE '\(\./adr/[0-9]{4}-[a-z0-9-]+\.md\)' docs/ADR.md 2>/dev/null | tr -d '()' | sort -u)

if [ $err -ne 0 ]; then
  echo ""
  echo "❌ ハーネス整合性チェック失敗"
  exit 1
fi
if [ $warn -gt 0 ]; then
  echo ""
  echo "⚠ ハーネス整合性チェック完了（警告 $warn 件）"
  exit 0
fi
echo ""
echo "✅ ハーネス整合性チェック成功"
