# Spike: データベース選定 (Aurora PostgreSQL vs RDS PostgreSQL vs DynamoDB)

> **Issue**: TBD
> **ステータス**: 完了
> **結論**: **DynamoDB（シングルテーブル設計）を推奨**
> **日付**: 2026-02-28

## 背景

voice-box プロジェクトの本番データベースを選定する。
当初は Aurora PostgreSQL Serverless v2 を想定していたが、最低コスト（0.5 ACU ≒ 月$40〜）が許容範囲を超えるため、コストを抑えた代替案を検討した。

## 結論

**DynamoDB（シングルテーブル設計）** を採用。

主な理由:

1. **コスト**: 無料枠内で運用可能（月$0〜5）
2. **Lambda との親和性**: VPC 不要、コールドスタートへの悪影響なし
3. **CDK 構成の簡素化**: VPC、サブネット、セキュリティグループ、RDS Proxy が全て不要
4. **運用負荷の最小化**: フルマネージドでパッチ適用やバックアップ監視が不要

## 影響

- Drizzle ORM → AWS SDK (`@aws-sdk/lib-dynamodb`) 直接利用に変更
- リポジトリパターンで DynamoDB 固有のロジックを隔離
- Docker Compose から PostgreSQL を削除、DynamoDB Local のみに

詳細な比較分析、シングルテーブル設計、アクセスパターンについては調査ドキュメントを参照。
