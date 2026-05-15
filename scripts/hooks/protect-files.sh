#!/usr/bin/env bash
# PreToolUse hook: 保護対象ファイルへの書き込みをブロック（exit 2 = block）
# Claude Code は hook 入力を stdin に JSON で渡す（公式仕様）。
# https://code.claude.com/docs/en/hooks

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
  .env|.env.*|*/.env|*/.env.*)
    echo "BLOCKED: $FILE は保護対象です（.env / 環境シークレット）" >&2
    exit 2
    ;;
  pnpm-lock.yaml|*/pnpm-lock.yaml|.nvmrc|*/.nvmrc)
    echo "BLOCKED: $FILE は保護対象の設定ファイルです（手動編集してください）" >&2
    exit 2
    ;;
esac

exit 0
