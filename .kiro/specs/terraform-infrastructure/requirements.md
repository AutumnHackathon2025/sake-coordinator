# 要件定義書

## はじめに

本文書は、日本酒推薦サービス向けのAWSインフラをTerraformで実装するための要件を定義します。Next.jsフルスタックアプリケーションの認証、ストレージ、データベースサービスをサポートするインフラを対象とし、Amazon Bedrock AgentCoreコンポーネントは別途実装するため除外します。

## 用語集

- **Terraform_Infrastructure**: AWSリソースをプロビジョニング・管理するInfrastructure as Code (IaC) システム
- **ECS_Service**: Next.jsアプリケーションをホストするAmazon Elastic Container Service
- **Cognito_Service**: ユーザー認証と認可を提供するAmazon Cognitoサービス
- **S3_Storage**: 画像ファイル（日本酒ラベルとメニュー写真）を保存するAmazon S3サービス
- **DynamoDB_Database**: 飲酒記録とユーザーデータを保存するAmazon DynamoDB NoSQLデータベース
- **VPC_Network**: 分離されたネットワーク環境を提供するVirtual Private Cloud
- **ALB_LoadBalancer**: ECSタスクにトラフィックを分散するApplication Load Balancer
- **ECR_Registry**: Dockerイメージを保存するElastic Container Registry
- **CloudWatch_Monitoring**: ログ記録と監視を行うAmazon CloudWatch

## 要件

### 要件1

**ユーザーストーリー:** DevOpsエンジニアとして、Terraformを使用してコアAWSインフラをプロビジョニングし、アプリケーションが信頼性とスケーラビリティを持つ基盤を構築したい。

#### 受け入れ基準

1. Terraform_InfrastructureはAWS Provider version 6.18.0を使用すること
2. Terraform_Infrastructureは複数のアベイラビリティゾーンにパブリックサブネットとプライベートサブネットを持つVPC_Networkを作成すること
3. Terraform_InfrastructureはHTTPS終端機能を持つALB_LoadBalancerをプロビジョニングすること
4. Terraform_Infrastructureは最小権限アクセスルールを持つセキュリティグループを作成すること
5. Terraform_Infrastructureはアプリケーション設定用の重要なリソース識別子を出力すること

### 要件2

**ユーザーストーリー:** システム管理者として、コンテナ化されたアプリケーションデプロイ用のECSインフラを構築し、Next.jsアプリケーションが本番環境で確実に動作するようにしたい。

#### 受け入れ基準

1. Terraform_InfrastructureはFargateローンチタイプのECS_Serviceクラスターを作成すること
2. Terraform_InfrastructureはDockerイメージ保存用のECR_Registryをプロビジョニングすること
3. Terraform_Infrastructureは適切なCPUとメモリ割り当てでECSタスク定義を設定すること
4. Terraform_InfrastructureはECSタスク実行用のIAMロールとポリシーを作成すること
5. Terraform_InfrastructureはCPU使用率に基づくECSサービスのオートスケーリングを有効にすること

### 要件3

**ユーザーストーリー:** アプリケーション開発者として、ユーザー認証インフラを構築し、ユーザーが日本酒推薦サービスに安全にアクセスできるようにしたい。

#### 受け入れ基準

1. Terraform_Infrastructureはメール検証機能付きのCognito_Serviceユーザープールを作成すること
2. Terraform_InfrastructureはNext.jsアプリケーション用のCognito_Serviceユーザープールクライアントを設定すること
3. Terraform_InfrastructureはPasskey（WebAuthn/FIDO2）認証とパスワードレス認証を設定すること
4. Terraform_Infrastructureは認証済みユーザーと未認証ユーザー用のIAMロールを作成すること
5. Terraform_Infrastructureはアプリケーション使用のためのCognito設定値を出力すること

### 要件4

**ユーザーストーリー:** アプリケーションユーザーとして、日本酒画像の信頼性のあるファイルストレージを利用し、日本酒ラベル写真とメニュー画像をアップロード・閲覧できるようにしたい。

#### 受け入れ基準

1. Terraform_Infrastructureはバージョニング有効化されたS3_Storageバケットを作成すること
2. Terraform_Infrastructureは安全なアクセス用のS3_Storageバケットポリシーを設定すること
3. Terraform_InfrastructureはWebアプリケーションアクセス用のCORS設定を有効にすること
4. Terraform_Infrastructureはコスト最適化のためのライフサイクルポリシーを設定すること
5. Terraform_Infrastructureは事前署名URL生成用のIAMポリシーを作成すること

### 要件5

**ユーザーストーリー:** アプリケーション開発者として、飲酒記録保存用のNoSQLデータベースを構築し、ユーザーデータを効率的に永続化・クエリできるようにしたい。

#### 受け入れ基準

1. Terraform_Infrastructureは飲酒記録用のDynamoDB_Databaseテーブルを作成すること
2. Terraform_Infrastructureは適切なパーティションキーとソートキーでDynamoDB_Databaseを設定すること
3. Terraform_Infrastructureはデータ保護のためのポイントインタイム復旧を有効にすること
4. Terraform_Infrastructureはクエリ最適化のためのGlobal Secondary Indexを作成すること
5. Terraform_Infrastructureはアプリケーションデータベースアクセス用のIAMポリシーを設定すること

### 要件6

**ユーザーストーリー:** システム管理者として、監視とログ記録インフラを構築し、アプリケーションパフォーマンスを追跡し問題をトラブルシューティングできるようにしたい。

#### 受け入れ基準

1. Terraform_Infrastructureはアプリケーションログ用のCloudWatch_Monitoringロググループを作成すること
2. Terraform_Infrastructureは重要なメトリクス用のCloudWatch_Monitoringアラームを設定すること
3. Terraform_Infrastructureはネットワーク監視用のVPCフローログを有効にすること
4. Terraform_Infrastructureはアラート通知用のSNSトピックを作成すること
5. Terraform_Infrastructureはコスト管理のためのログ保持ポリシーを設定すること

### 要件7

**ユーザーストーリー:** DevOpsエンジニアとして、モジュラーなTerraformコード構造を構築し、インフラコンポーネントを効率的に保守・再利用できるようにしたい。

#### 受け入れ基準

1. Terraform_Infrastructureは各サービス用の再利用可能なモジュールにコードを整理すること
2. Terraform_Infrastructureは一貫した変数命名と検証を使用すること
3. Terraform_Infrastructureはコスト配分のための適切なリソースタグ付けを実装すること
4. Terraform_Infrastructureは状態ロック機能付きのリモート状態バックエンドを設定すること
5. Terraform_Infrastructureは統合のための包括的な出力値を含むこと