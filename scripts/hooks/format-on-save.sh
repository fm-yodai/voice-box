#!/usr/bin/env bash
# PostToolUse hook: packages/ 配下の編集ファイルを Biome で自動フォーマット。
# Claude Code は hook 入力を stdin に JSON で渡す（公式仕様）。
# Biome 未インストール時・非対応ファイル時も安全（pnpm install 前でも壊れない）。

FILE=$(node -e "
let data='';
process.stdin.on('data',c=>data+=c);
process.stdin.on('end',()=>{
  try{
    const j=JSON.parse(data);
    process.stdout.write(j.tool_input?.file_path||'');
  }catch{}
});
" 2>/dev/null)

[ -z "$FILE" ] && exit 0

case "$FILE" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json)
    case "$FILE" in
      */packages/*)
        if [ -x node_modules/.bin/biome ]; then
          node_modules/.bin/biome format --write "$FILE" >/dev/null 2>&1 || true
        fi
        ;;
    esac
    ;;
esac

exit 0
