# GitHub Issue対応

以下のGitHub issueを解決してください。

Issue URL: $ARGUMENTS

## 手順

1. `gh issue view` コマンドでissueの内容を確認する
2. issueの要件を理解し、必要な変更を特定する
3. 新しいブランチを作成する（命名規則: `issue-{issue番号}-{簡潔な説明}`）
4. ブランチとissueを紐づける（`gh issue develop` コマンドを使用）
5. issueのラベルを `status:in-progress` に変更する
6. コードを実装・修正する
7. 変更をコミットする（コミットメッセージに `#issue番号` を含める）
8. ブランチをリモートにプッシュする
9. issueのラベルを `status:review` に変更する
10. プルリクエストを作成する（issueと紐づけ、`Closes #issue番号` を含める）
11. 必要に応じてissueにコメントを残す
