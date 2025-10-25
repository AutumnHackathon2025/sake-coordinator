
# **Amazon Bedrock AgentCore: 包括的技術分析**

## **第1章: Amazon Bedrock AgentCore \- 概要と基本原則**

### **1.1. 目的: Agentic AIのためのエンタープライズグレードプラットフォーム**

Amazon Bedrock AgentCoreは、AIエージェント（Agentic AI）をプロトタイプの段階から本番環境へと移行させるために設計された、包括的なフルマネージドサービス群です 1。多くのAIエージェント開発プロジェクトは、概念実証（PoC）の段階では成功を収めるものの、実際のビジネス環境で求められるスケーラビリティ、セキュリティ、信頼性、可観測性といった非機能要件の壁に直面し、本番投入に至らないケースが少なくありません 3。AgentCoreは、この「プロトタイプの煉獄（prototype purgatory）」と称される課題を解決するために開発されました 3。

その中核的な価値は、開発者がインフラストラクチャの管理に煩わされることなく、エージェントのコアロジック開発に集中できる環境を提供することにあります 5。具体的には、セッション管理、永続的なメモリ、外部ツールとの安全な連携、ID管理、モニタリングといった、本番運用に不可欠な基盤機能をマネージドサービスとして提供します 4。これにより、開発チームは数ヶ月を要する可能性のあった基盤インフラの構築作業から解放され、画期的なエージェントソリューションをより迅速に市場投入することが可能になります 3。

### **1.2. 主要な特徴: モジュール性、フレームワーク非依存性、スケーラビリティ**

Amazon Bedrock AgentCoreは、現代の多様な開発ニーズに応えるため、以下の3つの主要な特徴を備えています。

* **モジュール性（Modularity）**: AgentCoreは、それぞれが独立して機能する7つのサービス群で構成されています 2。これらのサービスは、必要に応じて個別に利用することも、組み合わせて利用することも可能なコンポーザブルな設計となっています 7。このアーキテクチャにより、開発者は既存のシステムにAgentCoreの特定の機能（例えば、メモリ機能のみ）を段階的に導入することができ、柔軟なシステム設計が可能となります。  
* **フレームワーク非依存性（Framework Agnosticism）**: AgentCoreは、特定のAIエージェント開発フレームワークに依存しません 5。CrewAI、LangGraph、LlamaIndex、Strands Agents、Google ADK、OpenAI Agents SDKといった主要なオープンソースフレームワークや、独自に開発されたカスタムロジックなど、開発者が選択した任意のツールセットでエージェントを構築できます 2。これは、特定のベンダーへのロックインを避け、プロジェクトの要件に最適な技術を選択できるという、エンタープライズ開発における重要な利点を提供します 10。  
* **モデル非依存性（Model Agnosticism）**: フレームワークと同様に、AgentCoreは利用する基盤モデル（Foundation Model, FM）を限定しません 3。Amazon Bedrockで提供されるモデルはもちろん、OpenAIのGPTシリーズやGoogleのGeminiシリーズなど、外部でホストされているモデルとも連携可能です 5。  
* **スケーラビリティ（Scalability）**: AgentCoreのアーキテクチャはサーバーレスを基本としており、ワークロードの変動に応じてゼロから数千の同時セッションまで自動的にスケールするように設計されています 3。これにより、突発的なトラフィックの増加にも柔軟に対応し、安定したサービス提供を維持します。

これらの特徴は、AgentCoreが単なるエージェント構築ツールではなく、多様な技術スタックで構成される現代のAIアプリケーション開発エコシステム全体を支えるための、基盤的な「オペレーティングシステム」としての役割を担うことを示唆しています。特定のフレームワークやモデルに縛られず、エンタープライズグレードの非機能要件をサービスとして提供することで、AWSはオープンソースの柔軟性とエンタープライズの堅牢性を両立させ、Agentic AI開発のデファクトスタンダードとなるインフラプラットフォームを目指していると考えられます。

### **1.3. 7つのコアサービス: 高レベルの紹介**

Amazon Bedrock AgentCoreプラットフォームは、以下の7つのコアサービスから構成されています。これらのサービスが連携することで、AIエージェントの構築、デプロイ、運用というライフサイクル全体を包括的にサポートします 2。

| サービス名 | コア機能 | 主要なユースケース |
| :---- | :---- | :---- |
| **AgentCore Runtime** | 安全なサーバーレス実行環境 | AIエージェントおよびツールのホスティング、スケーリング、セッション管理 |
| **AgentCore Memory** | 短期・長期記憶のマネージドサービス | 対話コンテキストの維持、ユーザーの嗜好や過去の対話内容の記憶 |
| **AgentCore Gateway** | 統一されたツール統合ハブ | 既存のAPIやLambda関数をエージェント用のツールに変換、ツールの発見 |
| **AgentCore Identity** | AIエージェント専用のID・アクセス管理 | ユーザーに代わって外部サービスへの安全なアクセス、認証・認可の管理 |
| **AgentCore Code Interpreter** | 安全なサンドボックス型コード実行環境 | データ分析、計算、可視化など、エージェントによる動的なコード生成と実行 |
| **AgentCore Browser** | マネージド型のセキュアなブラウザ環境 | Webサイトからの情報収集、フォーム入力、Webアプリケーションの自動操作 |
| **AgentCore Observability** | 統合されたモニタリング・デバッグソリューション | エージェントのパフォーマンス追跡、エラー分析、実行トレースの可視化 |

## **第2章: 技術アーキテクチャと主要概念**

### **2.1. 高レベルシステムアーキテクチャ**

Amazon Bedrock AgentCoreのアーキテクチャは、リソースの管理を行う「コントロールプレーン（Control Plane）」と、実際のエージェントのワークロードを処理する「データプレーン（Data Plane）」に明確に分離されています 1。

* **コントロールプレーン (bedrock-agentcore-control)**: Runtime、Memory、GatewayといったAgentCoreの各リソースの作成、設定、変更、監視を担当します。これらの操作は通常、デプロイ時やインフラ構成時にAWS Management Console、AWS CLI、またはAWS CloudFormationなどのIaC（Infrastructure as Code）ツールを通じて実行されます。  
* **データプレーン (bedrock-agentcore)**: デプロイされたエージェントの実行、メモリへのアクセス、ツールの呼び出しなど、ランタイム時の操作を担当します。エージェントアプリケーションが実行中に直接やり取りするのは、このデータプレーンのAPIです。

一般的なリクエストフローは以下のようになります。

1. エンドユーザーまたはクライアントアプリケーションが、AgentCore Runtimeにホストされたエージェントエンドポイントを呼び出します。  
2. リクエストはAgentCore Identityによって検証され、呼び出し元の認証・認可が行われます（インバウンド認証）。  
3. AgentCore Runtimeは、リクエストごとに分離された実行環境（microVM）を起動し、エージェントのロジックを実行します。  
4. エージェントは必要に応じてAgentCore Memoryを呼び出し、過去の対話履歴や長期的な知識を取得してコンテキストを補強します。  
5. 外部ツール（APIやLambda関数）を呼び出す必要がある場合、エージェントはAgentCore Gatewayにリクエストを送信します。  
6. GatewayはAgentCore Identityと連携して、ツールへのアクセスに必要な認証情報（APIキーやOAuthトークン）を取得し（アウトバウンド認証）、ターゲットとなるバックエンドサービスを安全に呼び出します。  
7. エージェントの実行過程全体はAgentCore Observabilityによって追跡され、メトリクスやトレース情報がAmazon CloudWatchに送信されます。

### **2.2. プロトコルの役割: MCPとA2A**

AgentCoreは、エージェント間の相互運用性を高めるため、標準化されたプロトコルを積極的に採用しています。これは、特定のベンダーに依存しないオープンなエコシステムを構築するというAWSの戦略を反映しています。独自プロトコルを開発するのではなく、新興の標準プロトコルを中核サービスに組み込むことで、サードパーティ製のツールやエージェントがAgentCoreエコシステムに容易に参加できるようになります。これにより、AgentCoreは閉じたプラットフォームではなく、多様なエージェントやツールが相互に通信するための共通基盤、いわばAgentic AIにおける「TCP/IP」層としての地位を確立しようとしています。

* **Model Context Protocol (MCP)**: エージェントとツール（API、データベース、その他のサービス）間の通信を標準化するためのプロトコルです 11。AgentCore GatewayはMCPをネイティブにサポートしており、従来のREST APIなどを自動的にMCP準拠のツールサーバーに変換する機能を持っています 15。これにより、エージェントはツールの実装詳細（プロトコルや認証方式など）を意識することなく、標準化された方法でツールを発見し、呼び出すことができます。  
* **Agent-to-Agent (A2A) Protocol**: 複数のエージェントが協調して複雑なタスクを解決するための、エージェント間通信プロトコルです 5。AgentCore RuntimeはこのA2Aプロトコルをサポートしており、異なる役割を持つ専門エージェント群を構築し、それらを連携させることが可能になります 16。これは、CrewAIのようなマルチエージェントフレームワークを活用した高度なシステム構築において不可欠な機能です 9。

### **2.3. エンタープライズセキュリティとコンプライアンス基盤**

AgentCoreは、エンタープライズ利用を前提として設計されており、AWSが提供する堅牢なセキュリティおよびガバナンス機能を完全にサポートしています。

* **Amazon VPCとAWS PrivateLink**: AgentCoreの各サービス（Runtime、Browser、Code Interpreterなど）は、Amazon Virtual Private Cloud (VPC) 内にデプロイしたり、VPC内のプライベートリソースに安全に接続したりできます 5。AWS PrivateLinkを利用することで、VPCとAgentCoreサービス間の通信をインターネットを経由させず、AWSのプライベートネットワーク内で完結させることができ、セキュリティレベルを大幅に向上させます 3。  
* **AWS Identity and Access Management (IAM)**: すべてのAgentCoreリソースへのアクセスは、IAMによってきめ細かく制御されます 15。IAMロールやポリシーを用いて、最小権限の原則に基づいた厳格なアクセス管理を実現できます。  
* **AWS CloudFormationとリソースタグ**: AgentCoreの全サービスはAWS CloudFormationをサポートしており、インフラのプロビジョニングをコードとして管理・自動化できます 5。また、すべてのリソースにタグを付与できるため、コスト配分、アクセス制御、リソース整理といったガバナンス要件に対応可能です 5。

## **第3章: AgentCore Runtime: 安全なエージェント実行環境**

### **3.1. 機能と目的**

AgentCore Runtimeは、AIエージェントやツールをホストするために特化して構築された、安全かつサーバーレスな実行環境です 2。開発者はサーバーのプロビジョニング、スケーリング、パッチ適用といったインフラ管理から解放され、エージェントのビジネスロジック開発に集中できます 16。Runtimeは、スケーリング、セッション管理、セキュリティ分離といった運用上の重要な課題を自動的に処理します。

### **3.2. 技術的メカニズム: microVMによるセッション分離**

AgentCore Runtimeの最も重要なセキュリティ機能は、セッションごとの完全な分離です 10。これは、各ユーザーセッションがそれぞれ独立した専用のmicroVM内で実行されることによって実現されます 3。

このアーキテクチャにより、CPU、メモリ、ファイルシステムといったコンピューティングリソースがセッション間で完全に隔離されます。結果として、あるセッションで実行されているコードが他のセッションのデータにアクセスしたり、影響を与えたりすることは原理的に不可能です。この「真のセッション分離（true session isolation）」は、特にマルチテナント型のアプリケーションや機密データを扱うエンタープライズシステムにおいて、データ漏洩のリスクを根本的に排除するための極めて重要な機能です 11。

セッションが終了すると、そのセッションのために割り当てられていたmicroVM全体が破棄され、メモリもクリーンアップ（サニタイズ）されるため、セッション間のデータ汚染の心配がありません 16。

### **3.3. 対応プロトコル: HTTP, MCP, A2A**

AgentCore Runtimeは、多様なユースケースに対応するため、複数の通信プロトコルをサポートしています 16。デプロイするコンテナは、対応するプロトコルの仕様を満たす必要があります。

| プロトコル | ユースケース | 必須エンドポイント | ポート | 主要な技術要件 |
| :---- | :---- | :---- | :---- | :---- |
| **HTTP** | 従来のリクエスト/レスポンス型エージェント | GET /ping (ヘルスチェック) POST /invocations (エージェント実行) | 8080 | JSON (非ストリーミング) または text/event-stream (ストリーミング) 形式のレスポンスをサポート 18 |
| **MCP** | ツールサーバーのデプロイ | POST /mcp | 8000 | ステートレスなサーバー実装が必須。Mcp-Session-Id ヘッダはRuntimeが自動管理 16 |
| **A2A** | マルチエージェント間通信 | (プロトコル仕様に準拠) | (プロトコル仕様に準拠) | エージェントの発見と協調動作のためのプロトコル 5 |

### **3.4. 非同期および長時間実行タスクのサポート**

従来のサーバーレスプラットフォーム（例: AWS Lambdaの最大実行時間15分）では、完了までに長時間を要する複雑なタスクの実行が困難でした。例えば、詳細なレポートの生成、大規模なデータ分析、外部システムの監視といったエージェントのタスクは、容易に15分の制限を超えてしまいます。これまで、このようなタスクを実現するには、AWS Step Functionsで複雑なステートマシンを組んだり、Amazon EC2やAWS Fargateのような常時稼働のコンピュートリソース上でエージェントを実行したりする必要があり、サーバーレスの利便性が損なわれていました。

AgentCore Runtimeは、この課題を直接的に解決します。業界最長クラスとなる最大8時間の実行ウィンドウをサポートしており 5、複雑で非同期なワークロードをサーバーレス環境で実行できます。これにより、アーキテクチャを大幅に簡素化し、高度なエージェントアプリケーションの開発を加速させます。

### **3.5. デプロイ要件**

AgentCore Runtimeにエージェントをデプロイするには、以下の要件を満たす必要があります。

* **コンテナ**: エージェントはARM64アーキテクチャのDockerコンテナとしてパッケージ化されている必要があります 18。  
* **依存関係**: Pythonプロジェクトの場合、依存ライブラリは requirements.txt ファイルにリストアップされている必要があります 16。  
* **デプロイプロセス**: 一般的なデプロイフローは、AgentCore Starter Toolkit (CLI) を使用して、(1) コンテナイメージをビルドし、(2) Amazon Elastic Container Registry (ECR) にプッシュし、(3) AgentCore Runtimeリソースを作成するという手順で行われます 20。

## **第4章: AgentCore Memory: コンテキスト認識型インタラクション**

### **4.1. 機能と目的**

AgentCore Memoryは、AIエージェントに記憶能力を付与するためのフルマネージドサービスです 21。単一の対話内での文脈を維持するための「短期記憶」と、複数のセッションをまたいで知識を永続化する「長期記憶」の両方を提供します 4。これにより、開発者は複雑なメモリ管理用のインフラ（ベクトルデータベースの構築・運用など）を自前で用意することなく、ユーザーとの対話を通じて学習し、よりパーソナライズされた体験を提供できる、コンテキスト認識型の高度なエージェントを構築できます 3。

### **4.2. 短期記憶: 対話コンテキスト**

短期記憶は、現在進行中のセッション内での直近の対話履歴をそのままの形で保持します 4。これにより、エージェントは「先ほどの質問ですが」「それについて詳しく教えてください」といった、文脈に依存したユーザーの発話を正しく理解できます。短期記憶はデフォルトで常に有効化されています 20。

### **4.3. 長期記憶: 抽出-統合-検索パイプライン**

長期記憶の真価は、単なる対話ログの保存ではなく、その内容を構造化された「知識」へと変換し、将来の対話に活かす点にあります。このプロセスは、非同期で実行される「抽出」「統合」「検索」の3段階のパイプラインによって実現されます 22。

このアーキテクチャは、LLMが持つコンテキストウィンドウの制限とトークン数に応じたコストという根本的な課題に対する、巧妙な解決策となっています。対話履歴全体を毎回プロンプトに含める方法は、非効率的でコストが高く、すぐにコンテキスト長の限界に達します。AgentCore Memoryの長期記憶パイプラインは、この問題を回避します。非同期の抽出プロセスで一度LLMを使い、冗長な会話テキストを構造化された知識（事実、嗜好、要約）へと「蒸留」します。その後の対話では、全文を読み込ませる代わりに、この蒸留された知識ベースに対して高速かつ安価なセマンティック検索（RetrieveMemoryRecords API）を実行し、最も関連性の高い情報だけを簡潔な形でプロンプトに注入します。これにより、パフォーマンスとコスト効率を両立させながら、対話を重ねるごとに価値が増大する永続的な知識資産をエージェントに持たせることが可能になります。

* **抽出（Extraction）**: 短期記憶に新しい対話イベントが記録されると、バックグラウンドでLLMを利用した抽出プロセスが起動します。このプロセスは、設定された「戦略（Strategy）」に基づき、対話内容から意味のある情報（事実、ユーザーの嗜好など）を識別し、構造化されたデータとして抽出します 22。  
* **統合（Consolidation）**: 新たに抽出された情報は、単にデータベースに追加されるわけではありません。既存の記憶と照合され、関連情報がマージされたり、矛盾する情報が解決されたり、重複が排除されたりします。このインテリジェントな統合プロセスにより、エージェントの知識ベースは常に一貫性が保たれ、最新の状態に維持されます 22。  
* **検索（Retrieval）**: 将来の対話セッションで、エージェントは自然言語によるセマンティック検索を通じて、長期記憶の中から現在の文脈に関連する知識を効率的に検索・取得できます。取得された知識はプロンプトに付加され、エージェントの応答をより的確でパーソナライズされたものにします 22。

### **4.4. 組み込みのメモリ戦略**

AgentCore Memoryは、一般的なユースケースに対応するため、事前に定義された3つの長期記憶抽出戦略を提供しています 22。

| 戦略名 | 目的 | 抽出データの例 |
| :---- | :---- | :---- |
| **セマンティックメモリ (Semantic Memory)** | 対話から客観的な事実や知識を抽出する。 | "顧客の会社はシアトル、オースティン、ボストンに合計500人の従業員がいる" |
| **ユーザー嗜好メモリ (User Preference Memory)** | 明示的または暗示的に示されたユーザーの好みや設定を抽出する。 | {"preference": "開発作業にはPythonを好む", "categories": \["programming", "code-style"\]} |
| **要約メモリ (Summary Memory)** | 特定のトピックに関する対話の要点を、構造化されたXML形式で継続的に要約する。 | \<topic="UIコンポーネントの警告修正"\>開発者はUIライブラリのTextareaAutosizeコンポーネントで発生していた警告を正常に修正した。\</topic\> |

### **4.5. カスタムおよび自己管理戦略**

より高度なカスタマイズが必要な場合のために、AgentCore Memoryは以下のオプションを提供します。

* **オーバーライド付き組み込み戦略（Built-in with Overrides）**: 組み込み戦略の挙動を、カスタムプロンプトを提供することで調整できます。これにより、特定のドメインや要件に合わせて抽出・統合のロジックを微調整することが可能です 2。  
* **自己管理戦略（Self-Managed）**: メモリの抽出・統合パイプラインを完全に独自ロジックで制御したい開発者向けです。独自のアルゴリズムや外部サービスと連携した、高度なメモリ管理を実装できます 2。

## **第5章: AgentCore Gateway: 統一されたツール統合**

### **5.1. 機能と目的: 中央集権型ツールサーバー**

AgentCore Gatewayは、AIエージェントが外部のツールやサービスを発見し、利用するための、中央集権化されたフルマネージドサービスです 15。多数のエージェントが多数のツールに接続する必要がある場合に生じる、組み合わせ的な複雑さ（M×N問題）を解決します 15。Gatewayは、エージェントとツール間の接続におけるセキュリティ、インフラ、プロトコル変換といった複雑な処理を抽象化し、開発者がインテリジェントなエージェント体験の構築に集中できるようにします。

### **5.2. 技術的メカニズム: ターゲットのMCPツールへの変換**

Gatewayの中核機能は、様々な種類のバックエンドサービス（「ターゲット」と呼ばれる）を、エージェントが標準的な方法で利用できるMCP（Model Context Protocol）準拠のツールに変換することです 15。この変換は、既存のAPI仕様書などを提供するだけで、コーディングなし（ゼロコード）で実行できます 3。これにより、エージェントはすべてのツールと統一されたMCPプロトコルで通信でき、ツールごとの実装差異を意識する必要がなくなります。

このアーキテクチャは、エージェントのロジックとツールの実装を疎結合にするという重要な利点をもたらします。従来のアプローチでは、エージェントのコード内に特定のAPIクライアントや認証情報をハードコーディングする必要があり、ツールの仕様変更がエージェントの改修に直結していました。Gatewayを介することで、エージェントは単一のGatewayエンドポイントとMCPで通信する方法さえ知っていればよくなります。バックエンドのツールがLambda関数からREST APIに変更されたり、認証方式が更新されたりしても、Gateway上のツール定義が変わらない限り、エージェント側のコードを一切変更する必要がありません。これは、ツール開発チームとエージェント開発チームの独立性を高め、エンタープライズ規模でのツールエコシステムの保守性・拡張性を飛躍的に向上させる、マイクロサービス的なアーキテクチャパターンと言えます。

### **5.3. 対応ターゲット**

AgentCore Gatewayがツールとして公開できるバックエンドサービス（ターゲット）の種類は以下の通りです 2。

* **AWS Lambda関数**: サーバーレス関数をエージェント用のツールとして直接公開できます。  
* **OpenAPIスキーマ / Smithyモデル**: OpenAPI (Swagger) やSmithyで定義された既存のREST APIをツールとして統合できます。  
* **既存のMCPサーバー**: すでにMCPプロトコルに対応しているツールサーバーをGatewayに登録し、プロキシとして機能させることができます 2。

### **5.4. インテリジェントなツール発見とセキュリティ統合**

* **インテリジェントなツール発見**: Gatewayは、エージェントが特定のタスクに最適なツールを動的に見つけられるよう、セマンティック検索機能を提供します 15。これにより、エージェントに多数のツールが提供された場合に発生しがちな、不適切なツール選択や性能劣化（「ツール過負荷」）の問題を緩和します。  
* **セキュリティ統合**: GatewayはAgentCore Identityと緊密に連携し、エージェントからGatewayへのアクセス（インバウンド認証）と、Gatewayからターゲットへのアクセス（アウトバウンド認証）の両方を管理します 5。IAMロールやOAuth 2.0を利用して、安全なツール呼び出しを実現します 15。

## **第6章: AgentCore Identity: 安全なアクセス管理**

### **6.1. 機能と目的**

AgentCore Identityは、AIエージェントのために特別に構築された、包括的なIDおよびアクセス管理サービスです 24。エージェントが、自律的なワークロードとして、あるいは人間のユーザーに代わって、AWSリソースやサードパーティのツール（例: GitHub, Salesforce, Slack）に安全にアクセスするための仕組みを提供します 1。

### **6.2. デュアル認証モデル: インバウンド認証とアウトバウンド認証**

AgentCore Identityは、エージェントに関連するアクセスを二段階で保護するデュアル認証モデルを採用しています 24。

* **インバウンド認証（Inbound Authentication）**: エージェントを呼び出そうとするユーザーやアプリケーションの身元を検証します。AWSのIAM認証（SigV4）や、Amazon CognitoやOktaなどの外部IDプロバイダーが発行するOAuth 2.0/OIDC準拠のJWT（JSON Web Token）に対応しています。  
* **アウトバウンド認証（Outbound Authentication）**: エージェントが下流のツールやリソースにアクセスする際の認証を管理します。ターゲットサービスが必要とする認証情報（APIキーやOAuthトークンなど）を安全に取得・管理し、エージェントに提供します。

このデュアル認証モデルは、AIエージェントにおける典型的なセキュリティリスクである「混乱した代理人（Confused Deputy）」問題を解決するために極めて重要です。AIエージェントはユーザーの代わりにアクションを実行する「代理人」ですが、悪意のあるユーザーがエージェントを騙して、エージェント自身が持つ広範な権限を不正に利用させるリスクがあります。AgentCore Identityの仕組みはこれを防ぎます。まずインバウンド認証で「ユーザー」の身元を確認し、次いでアウトバウンド認証で、その「特定のユーザー」が許可された範囲の権限しか持たない一時的なトークンをエージェントに渡します。エージェント自身は静的な広範な権限を持たず、リクエストの都度、呼び出し元ユーザーの権限を一時的に借用する形になるため、最小権限の原則が徹底され、機密性の高いエンタープライズシステムへも安全にアクセスさせることが可能になります。

### **6.3. IDプロバイダーとの統合**

AgentCore Identityは、業界標準のOAuth 2.0およびOpenID Connect (OIDC) に準拠しており、Google, Microsoft, Slack, Salesforce, Oktaなど、多数の主要なIDプロバイダーとのネイティブ統合が事前設定されています 2。これにより、既存のID管理システムをそのまま活用し、複雑なOAuth 2.0のフロー（マシン間通信用の2-legged OAuthや、ユーザー代理実行用の3-legged OAuth）をAgentCoreにオフロードできます 15。

### **6.4. 安全な認証情報管理: トークンボールト**

OAuthのリフレッシュトークンやAPIキーといった、長期的に有効な機密性の高い認証情報は、AgentCore Identityが提供する「トークンボールト」に安全に保管されます 5。保管される認証情報は、保管時（at-rest）および転送中（in-transit）のいずれにおいても暗号化され、不正なアクセスから保護されます 24。

## **第7章: 組み込みツール: エージェント能力の拡張**

AgentCoreは、エージェントに強力な機能を追加するための、マネージド型の組み込みツールを提供します。これらのツールは、企業が自前で構築するには多大なエンジニアリングコストと高度なセキュリティ知識を要する、複雑かつ高リスクな機能を、安全で使いやすいAPIコールとして提供します。AWSは、エージェントが必要とする最も一般的で価値の高い機能を特定し、それらをエンタープライズグレードのマネージドサービスとして提供することで、開発者が高度なエージェントを構築する際の障壁を劇的に下げています。

### **7.1. AgentCore Code Interpreter**

* **7.1.1. 技術的メカニズムとサンドボックス環境**: AIエージェントが生成したコードを安全に実行するための分離された環境を提供します 1。サポートされる言語はPython, JavaScript, TypeScriptです 26。各実行は、他のワークロードやホストシステムから完全に隔離された専用のコンテナ化されたサンドボックス内で行われます 25。ネットワークアクセスは、外部から完全に遮断されたモードと、制御されたパブリックアクセスモードから選択でき、CPUやメモリ使用量の上限設定といったリソース制約も構成可能です 25。  
* **7.1.2. 対応言語とプリインストールライブラリ**: Python実行環境には、pandas, numpy, matplotlib, scikit-learn, scipyといった、データサイエンスで頻繁に利用されるライブラリがプリインストールされています 2。これにより、エージェントは複雑なデータ分析、統計計算、データ可視化といったタスクを即座に実行できます。  
* **7.1.3. ファイル操作とセッション管理**: 複数ステップにわたる処理のために、状態を維持する永続的なセッションをサポートします 25。セッションベースのファイルストレージも提供され、最大5 GBのファイルをAmazon S3からアップロード/ダウンロードして処理することが可能です 25。

### **7.2. AgentCore Browser**

* **7.2.1. 技術的メカニズムとセキュアなブラウジングセッション**: エージェントがWebサイトと大規模に対話するための、フルマネージド型のクラウドベースブラウザランタイムです 1。各ブラウジングセッションは、他のセッションから隔離された安全なコンテナ内で実行され、エンタープライズレベルのセキュリティを確保します 28。  
* **7.2.2. 自動化機能 (CDP経由)**: エージェントは、Playwright, Puppeteer, Seleniumといった標準的なブラウザ自動化ライブラリを使用してブラウザを制御します 28。これらのライブラリは、Chrome DevTools Protocol (CDP) を用いて、安全なWebSocket接続経由でAgentCore Browserインスタンスと通信します 28。これにより、JavaScriptを多用する動的なWebアプリケーションの操作、フォームへの入力、データ抽出といった複雑なタスクの自動化が可能です 28。  
* **7.2.3. 可観測性機能: ライブビューとセッションリプレイ**:  
  * **ライブビュー（Live View）**: 実行中のブラウザセッションをリアルタイムで視覚的に監視し、必要に応じて手動で操作を介入させることができる機能です 32。  
  * **セッションリプレイ（Session Replay）**: ブラウザセッション中のすべての操作（DOMの変更、ネットワークリクエスト、コンソールログなど）を記録し、指定されたAmazon S3バケットに保存します 26。記録されたセッションは後からビデオのように再生でき、デバッグ、監査、あるいはトレーニングデータの作成に活用できます 32。

## **第8章: AgentCore Observability: 監視と分析**

### **8.1. 機能と目的**

AgentCore Observabilityは、AIエージェントの動作を完全に可視化するために設計された包括的な監視ソリューションです 34。エージェントの意思決定プロセスは非決定的であり、従来のアプリケーションとは異なる監視のアプローチが求められます。このサービスは、開発者がエージェントのインタラクションを監視、分析、監査、デバッグするのを容易にし、信頼性の高いAIシステムの構築を支援します 34。

### **8.2. Amazon CloudWatchとの連携**

AgentCoreから収集されたテレメトリデータは、自動的にAmazon CloudWatchに送信され、CloudWatch内の「GenAI Observability」ダッシュボードで可視化されます 20。このダッシュボードでは、トークン使用量、API呼び出しのレイテンシー、ツール呼び出しの頻度、セッション数、エラー率といった、エージェントのパフォーマンスを評価するための主要なメトリクスが、すぐに利用できる形で提供されます 34。

### **8.3. OpenTelemetry (OTEL) 互換性**

AgentCore Observabilityのアーキテクチャは、業界標準であるOpenTelemetry (OTEL) および生成AI向けのセマンティック規約に準拠しています 34。これは、多くの大企業がすでにDatadogやNew Relicといったサードパーティ製の統合監視プラットフォームに投資している現状を考慮した戦略的な設計です。OTEL互換性により、AgentCoreから収集したエージェントのテレメトリデータを、CloudWatchだけでなく、既存の監視プラットフォームにもシームレスにエクスポートできます 3。

これにより、企業はAIエージェントのパフォーマンスデータを、従来のマイクロサービスやデータベース、フロントエンドアプリケーションのデータと同じダッシュボードで一元的に監視・分析することが可能になります。これは、システム全体での障害発生時の原因究明やパフォーマンスチューニングにおいて極めて重要であり、AgentCoreが既存のエンタープライズITエコシステムにスムーズに統合されるための鍵となる機能です。この機能を利用するには、aws-opentelemetry-distro (ADOT) ライブラリをエージェントの依存関係に追加する必要があります 34。

### **8.4. 主要な可観測性の概念: トレース、スパン、セッション**

AgentCore Observabilityは、以下の3つの階層的な概念を用いてエージェントの動作をモデル化します 37。

* **セッション（Sessions）**: ユーザーとの一連の対話全体を表す最上位のコンテキストです。  
* **トレース（Traces）**: セッション内での単一のリクエストからレスポンスまでの一連の処理フローを表します。エージェントがリクエストを受け取ってから最終的な応答を返すまでのエンドツーエンドの処理を可視化します。  
* **スパン（Spans）**: トレースを構成する個々の具体的な処理単位です。例えば、「LLM呼び出し」「ツールAの実行」「メモリからの検索」といった各ステップが1つのスパンに対応します。

## **第9章: 開発とデプロイのワークフロー**

### **9.1. AgentCore Python SDK**

AgentCore Python SDKは、既存のエージェントロジックをAgentCoreの各サービスと統合するためのPythonライブラリです 38。このSDKは、エージェントのコードに最小限の変更を加えるだけで、ローカルで開発したエージェントを本番環境に対応させるための軽量なラッパーやプリミティブを提供します 38。

主要なコンポーネントには、エージェントの関数をAPIサーバーに変換する BedrockAgentCoreApp クラスや、Memory、Identity、組み込みツールを操作するためのクライアントが含まれます 38。

### **9.2. AgentCore Starter Toolkit (CLI)**

AgentCore Starter Toolkitは、agentcore というコマンドラインインターフェース（CLI）を提供し、エージェントの設定からデプロイ、テストまでの一連のワークフローを簡素化します 20。

主要なコマンドは以下の通りです。

* agentcore configure: 対話形式でエージェントの設定ファイル（.bedrock\_agentcore.yaml）を作成します。IAMロールの自動作成、ECRリポジトリのセットアップ、Memoryの有効化などを行います 20。  
* agentcore launch: 設定ファイルに基づき、Dockerコンテナをビルドし、ECRにプッシュし、AgentCore Runtimeにエージェントをデプロイします。--local フラグを付けると、ローカル環境でコンテナを実行してテストすることもできます 20。  
* agentcore invoke: デプロイされたエージェントのエンドポイントを呼び出し、動作をテストします 34。  
* agentcore destroy: launch コマンドによって作成されたAWSリソース（Runtime、IAMロール、ECRリポジトリなど）をクリーンアップします 23。

### **9.3. Agenticフレームワークとの統合**

AgentCoreのフレームワーク非依存性という特徴を活かし、様々なオープンソースフレームワークと連携させることが可能です。ここでは、LangGraphとの統合を例に具体的な実装を示します 23。

エージェントのエントリーポイントとなる関数を bedrock\_agentcore.BedrockAgentCoreApp の @app.entrypoint デコレータでラップします。この関数は、リクエストの payload と、セッション情報を含む RequestContext オブジェクトを引数として受け取ります 23。

Python

from bedrock\_agentcore import BedrockAgentCoreApp  
from bedrock\_agentcore.runtime.context import RequestContext  
\# (AgentCore Memory Managerのインポート)  
\# (LangGraphのグラフ定義)

app \= BedrockAgentCoreApp()  
memory\_manager \= \# AgentCore Memory Managerの初期化

@app.entrypoint  
def invoke(payload: dict, context: RequestContext \= None) \-\> dict:  
    session\_id \= context.session\_id if context else "default-session"  
    prompt \= payload.get("prompt")

    \# 1\. AgentCore Memoryから関連情報を検索  
    memory\_context \= memory\_manager.get\_memory\_context(  
        user\_input=prompt,  
        session\_id=session\_id  
    )  
    enhanced\_prompt \= f"{memory\_context}\\n\\nUser: {prompt}"

    \# 2\. LangGraphエージェントを実行  
    graph\_input \= {"messages": \[{"role": "user", "content": enhanced\_prompt}\]}  
    response \= graph.invoke(graph\_input)  
    response\_message \= response\['messages'\]\[-1\].content

    \# 3\. AgentCore Memoryに対話内容を保存  
    memory\_manager.store\_conversation(  
        user\_input=prompt, \# 元のプロンプトを保存  
        response=response\_message,  
        session\_id=session\_id  
    )

    return {"result": response\_message}

このコードは、(1) AgentCore Memoryから過去の対話コンテキストを取得してプロンプトを補強し、(2) LangGraphで定義されたエージェントロジックを実行し、(3) 新しい対話内容を再びAgentCore Memoryに保存するという、典型的な統合パターンを示しています 23。

## **第10章: APIリファレンス概要**

Amazon Bedrock AgentCoreは、リソース管理用の「コントロールプレーンAPI」と、ランタイム操作用の「データプレーンAPI」という2種類のAPIエンドポイントを提供します 13。

### **10.1. コントロールプレーンAPI: リソース管理**

bedrock-agentcore-control エンドポイントで提供されるAPI群で、AgentCoreの各サービスリソースのライフサイクル管理（作成、設定、取得、削除）を担当します 1。

| リソース | 作成アクション | 取得アクション | 一覧表示アクション | 削除アクション |
| :---- | :---- | :---- | :---- | :---- |
| **Agent Runtime** | CreateAgentRuntime | GetAgentRuntime | ListAgentRuntimes | DeleteAgentRuntime |
| **Memory** | CreateMemory | GetMemory | ListMemories | DeleteMemory |
| **Gateway** | CreateGateway | GetGateway | ListGateways | DeleteGateway |
| **Identity (OAuth)** | CreateOauth2CredentialProvider | GetOauth2CredentialProvider | ListOauth2CredentialProviders | DeleteOauth2CredentialProvider |
| **Code Interpreter** | CreateCodeInterpreter | GetCodeInterpreter | ListCodeInterpreters | DeleteCodeInterpreter |
| **Browser** | CreateBrowser | GetBrowser | ListBrowsers | DeleteBrowser |

出典: 41

### **10.2. データプレーンAPI: ランタイム操作**

bedrock-agentcore エンドポイントで提供されるAPI群で、デプロイされたリソースの実行時の操作を担当します 1。エージェントアプリケーションが直接呼び出すのは主にこちらのAPIです。

| 機能 | 主要なAPIアクション | 説明 |
| :---- | :---- | :---- |
| **エージェント実行** | InvokeAgentRuntime | AgentCore Runtimeにデプロイされたエージェントを呼び出す。 |
| **短期記憶** | CreateEvent, ListEvents, GetEvent, DeleteEvent | セッション内の対話イベントを作成、一覧表示、取得、削除する。 |
| **長期記憶** | BatchCreateMemoryRecords, RetrieveMemoryRecords, ListMemoryRecords, DeleteMemoryRecord | 長期記憶レコードを一括作成、セマンティック検索、一覧表示、削除する。 |
| **Code Interpreter** | StartCodeInterpreterSession, InvokeCodeInterpreter, StopCodeInterpreterSession | コード実行用のセッションを開始、コードを実行、セッションを停止する。 |
| **Browser** | StartBrowserSession, UpdateBrowserStream, StopBrowserSession | ブラウザセッションを開始、操作をストリーミング、セッションを停止する。 |
| **ID/認証** | GetWorkloadAccessToken, GetResourceOauth2Token | エージェントのワークロードIDトークンや、ツールアクセス用のOAuthトークンを取得する。 |

出典: 14

## **第11章: 比較: AgentCore vs. Agents for Amazon Bedrock**

AWSのAgentic AIサービスには、「Amazon Bedrock AgentCore」と、それ以前から提供されている「Agents for Amazon Bedrock」（以下、Bedrock Agents）の2つが存在します。これらは単なる新旧の関係ではなく、異なる設計思想とターゲットユーザーを持つ、明確に区別されたサービスです。

この2つのサービスは、AIエージェント開発における異なるアプローチを象徴しています。「Bedrock Agents」は、迅速な開発とAWSエコシステム内での完結を重視するユーザー向けの「ノーコード/ローコード」プラットフォームに例えられます。シンプルさと引き換えに、モデル選択などの柔軟性には制約があります。「AgentCore」は、プロの開発者やエンタープライズ向けの「IaaS/PaaS」に相当します。柔軟性、制御性、相互運用性を最優先し、開発者が選択した任意のツールでエージェントを構築するための堅牢なインフラを提供します。これは、AWSが市場をセグメント化し、「Bedrock Agents」を迅速なプロジェクト立ち上げの入口とし、「AgentCore」を複雑で本番クリティカルなシステムの最終的なデプロイ先として位置づけていることを示唆しています。

### **11.1. アーキテクチャの違い**

* **Bedrock Agents**: シンプルさを重視した、モノリシックでより規範的な（prescriptive）マネージドサービスです 10。エージェントの作成からツール連携、実行までが一つのサービス内で完結するように設計されており、Amazon Bedrockサービスと緊密に統合されています 46。  
* **AgentCore**: 柔軟性と拡張性を重視した、モジュール型のインフラプラットフォームです 2。Runtime, Memory, Gatewayといった独立したサービスコンポーネントの集合体であり、開発者は必要な部品だけを選択して組み合わせることができます 47。

### **11.2. 機能と柔軟性の比較**

| 特徴 | Agents for Amazon Bedrock | Amazon Bedrock AgentCore |
| :---- | :---- | :---- |
| **基本思想** | シンプルで迅速なエージェント構築のための統合型マネージドサービス | 任意のフレームワーク/モデルで構築されたエージェントを本番運用するためのインフラプラットフォーム |
| **モデルサポート** | Amazon Bedrockでホストされているモデルのみ 10 | Bedrock内外を問わず、任意の基盤モデルをサポート 5 |
| **フレームワークサポート** | AWSが提供する定義済みフレームワーク | 任意のオープンソースフレームワーク（LangGraph, CrewAI等）またはカスタムロジックをサポート 2 |
| **アーキテクチャ** | 統合型（All-in-one） | モジュール型・コンポーザブル 2 |
| **セッション分離** | (限定的な情報) | microVMによる完全なセッション分離を提供 10 |
| **メモリのカスタマイズ** | 限定的なメモリ保持機能 46 | 短期・長期記憶、複数戦略、カスタムロジックなど高度なカスタマイズが可能 22 |
| **ツール統合** | Action GroupとKnowledge Baseによる統合 | AgentCore Gatewayによる柔軟なAPI/Lambda/MCPツール統合 15 |
| **セキュリティ/ID管理** | IAMロールベース | AgentCore Identityによる高度なID管理（OAuth, トークンボールト等） 24 |
| **可観測性** | CloudWatch Logsによる基本的なログ | AgentCore Observabilityによる詳細なトレース（OTEL互換） 34 |

出典: 2

### **11.3. ユースケースの差別化**

* **Agents for Amazon Bedrockを選択すべきケース**:  
  * 可能な限りシンプルかつ迅速にエージェントをセットアップ・デプロイしたい場合 10。  
  * 利用するモデルがAmazon Bedrock内のものだけで十分な場合 10。  
  * 基本的なエージェント機能を最小限の設定で実現したい場合。  
  * AWSが提供する規範的なアプローチを好むチーム 10。  
* **Amazon Bedrock AgentCoreを選択すべきケース**:  
  * エンタープライズグレードのセキュリティ（特にセッション分離）やコンプライアンス要件が厳しい場合 10。  
  * 外部の基盤モデルやオープンソースの最新フレームワークを利用したい場合。  
  * マルチテナント型アプリケーションを構築する場合。  
  * 既存のIDプロバイダー（Oktaなど）と連携する必要がある場合。  
  * 詳細なパフォーマンス分析やデバッグのための包括的な可観測性が必要な場合 10。

#### **Works cited**

1. Amazon Bedrock AgentCore Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/zh\_tw/bedrock-agentcore/?icmpid=docs\_homepage\_ml](https://docs.aws.amazon.com/zh_tw/bedrock-agentcore/?icmpid=docs_homepage_ml)  
2. What is Amazon Bedrock AgentCore? \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html)  
3. Make agents a reality with Amazon Bedrock AgentCore: Now generally available \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-is-now-generally-available/](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-is-now-generally-available/)  
4. Move your AI agents from proof of concept to production with Amazon Bedrock AgentCore, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/move-your-ai-agents-from-proof-of-concept-to-production-with-amazon-bedrock-agentcore/](https://aws.amazon.com/blogs/machine-learning/move-your-ai-agents-from-proof-of-concept-to-production-with-amazon-bedrock-agentcore/)  
5. Amazon Bedrock AgentCore is now generally available \- AWS, accessed October 25, 2025, [https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available/](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available/)  
6. AWS Doubles Down on Agentic AI; Announces Amazon Bedrock AgentCore: Key Enterprise Insights from AWS Summit New York, 2025 \- AIM Research, accessed October 25, 2025, [https://aimresearch.co/product/aws-doubles-down-on-agentic-ai-announces-amazon-bedrock-agentcore](https://aimresearch.co/product/aws-doubles-down-on-agentic-ai-announces-amazon-bedrock-agentcore)  
7. Securing AI agents with Amazon Bedrock AgentCore Identity \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/security/securing-ai-agents-with-amazon-bedrock-agentcore-identity/](https://aws.amazon.com/blogs/security/securing-ai-agents-with-amazon-bedrock-agentcore-identity/)  
8. Building Secure, Scalable, and Observable Agentic Systems using Amazon Bedrock AgentCore | by Onkar Mishra | Sep, 2025 | Medium, accessed October 25, 2025, [https://medium.com/@onkarmishra/building-secure-scalable-and-observable-agentic-systems-using-agentcore-b6ad8226f970](https://medium.com/@onkarmishra/building-secure-scalable-and-observable-agentic-systems-using-agentcore-b6ad8226f970)  
9. Building Production-Ready AI Agents: A Multi-Framework Journey with Amazon Bedrock AgentCore \- DEV Community, accessed October 25, 2025, [https://dev.to/aws/building-production-ready-ai-agents-a-multi-framework-journey-with-amazon-bedrock-agentcore-p32](https://dev.to/aws/building-production-ready-ai-agents-a-multi-framework-journey-with-amazon-bedrock-agentcore-p32)  
10. MCP vs Strands vs RAG vs A2A vs Bedrock vs AgentCore vs Q: AWS AI Agents Compared, accessed October 25, 2025, [https://aws.plainenglish.io/mcp-vs-strands-vs-rag-vs-a2a-vs-bedrock-vs-agentcore-vs-q-aws-ai-agents-compared-2025-788089e7ed33](https://aws.plainenglish.io/mcp-vs-strands-vs-rag-vs-a2a-vs-bedrock-vs-agentcore-vs-q-aws-ai-agents-compared-2025-788089e7ed33)  
11. AWS announces new innovations for building AI agents at AWS Summit New York 2025, accessed October 25, 2025, [https://www.aboutamazon.com/news/aws/aws-summit-agentic-ai-innovations-2025](https://www.aboutamazon.com/news/aws/aws-summit-agentic-ai-innovations-2025)  
12. Amazon Bedrock AgentCore Resources, accessed October 25, 2025, [https://aws.amazon.com/bedrock/agentcore/resources/](https://aws.amazon.com/bedrock/agentcore/resources/)  
13. Amazon Bedrock AgentCore Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/](https://docs.aws.amazon.com/bedrock-agentcore/)  
14. Welcome \- Amazon Bedrock AgentCore Data Plane \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/Welcome.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/Welcome.html)  
15. Introducing Amazon Bedrock AgentCore Gateway: Transforming enterprise AI agent tool development | Artificial Intelligence, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-gateway-transforming-enterprise-ai-agent-tool-development/](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-gateway-transforming-enterprise-ai-agent-tool-development/)  
16. How it works \- Amazon Bedrock AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html)  
17. Amazon Bedrock AgentCore Runtime, Browser, and Code Interpreter add support for VPC, AWS PrivateLink, CloudFormation, and tagging, accessed October 25, 2025, [https://aws.amazon.com/about-aws/whats-new/2025/09/amazon-bedrock-agentcore-runtime-browser-code-interpreter-vpc-privatelink-cloudformation-tagging/](https://aws.amazon.com/about-aws/whats-new/2025/09/amazon-bedrock-agentcore-runtime-browser-code-interpreter-vpc-privatelink-cloudformation-tagging/)  
18. AWS Bedrock AgentCore Runtime for AWS Marketplace, accessed October 25, 2025, [https://docs.aws.amazon.com/marketplace/latest/userguide/bedrock-agentcore-runtime.html](https://docs.aws.amazon.com/marketplace/latest/userguide/bedrock-agentcore-runtime.html)  
19. Amazon Bedrock AgentCore Deep dive series: Runtime | AWS Show and Tell \- YouTube, accessed October 25, 2025, [https://www.youtube.com/watch?v=wizEw5a4gvM](https://www.youtube.com/watch?v=wizEw5a4gvM)  
20. Get started with Amazon Bedrock AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-get-started-toolkit.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-get-started-toolkit.html)  
21. Amazon Bedrock AgentCore Deep dive series: Memory | AWS Show and Tell \- YouTube, accessed October 25, 2025, [https://www.youtube.com/watch?v=-N4v6-kJgwA](https://www.youtube.com/watch?v=-N4v6-kJgwA)  
22. Building smarter AI agents: AgentCore long-term memory deep dive \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/building-smarter-ai-agents-agentcore-long-term-memory-deep-dive/](https://aws.amazon.com/blogs/machine-learning/building-smarter-ai-agents-agentcore-long-term-memory-deep-dive/)  
23. Building Production-Ready AI Agents with LangGraph and Amazon ..., accessed October 25, 2025, [https://dev.to/aws/building-production-ready-ai-agents-with-langgraph-and-amazon-bedrock-agentcore-4h5k](https://dev.to/aws/building-production-ready-ai-agents-with-langgraph-and-amazon-bedrock-agentcore-4h5k)  
24. Introducing Amazon Bedrock AgentCore Identity: Securing agentic ..., accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-identity-securing-agentic-ai-at-scale/](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-identity-securing-agentic-ai-at-scale/)  
25. Introducing the Amazon Bedrock AgentCore Code Interpreter ... \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/introducing-the-amazon-bedrock-agentcore-code-interpreter/](https://aws.amazon.com/blogs/machine-learning/introducing-the-amazon-bedrock-agentcore-code-interpreter/)  
26. Amazon Bedrock AgentCore \- Developer Guide, accessed October 25, 2025, [https://docs.aws.amazon.com/pdfs/bedrock-agentcore/latest/devguide/bedrock-agentcore-dg.pdf](https://docs.aws.amazon.com/pdfs/bedrock-agentcore/latest/devguide/bedrock-agentcore-dg.pdf)  
27. Creating an AgentCore Code Interpreter \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-create.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-create.html)  
28. Introducing Amazon Bedrock AgentCore Browser Tool | Artificial Intelligence \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-browser-tool/](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-agentcore-browser-tool/)  
29. How I Combined Strands Agents, Bedrock AgentCore Runtime, and AgentCore Browser to Automate AWS Docs \- DEV Community, accessed October 25, 2025, [https://dev.to/aws-builders/how-i-combined-strands-agents-bedrock-agentcore-runtime-and-agentcore-browser-to-automate-aws-docs-50nd](https://dev.to/aws-builders/how-i-combined-strands-agents-bedrock-agentcore-runtime-and-agentcore-browser-to-automate-aws-docs-50nd)  
30. Browser session recording and replay \- Amazon Bedrock AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-session-replay.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-session-replay.html)  
31. AgentCore Deep dive series: Browser Tool & Code Interpreter Tool | AWS Show and Tell \- Generative AI \- YouTube, accessed October 25, 2025, [https://www.youtube.com/watch?v=z3lAJ-Nf\_lk](https://www.youtube.com/watch?v=z3lAJ-Nf_lk)  
32. How to use session replay \- Amazon Bedrock AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/session-replay-how-to-use.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/session-replay-how-to-use.html)  
33. Observability and session replay \- Amazon Bedrock AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-observability.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-observability.html)  
34. Build trustworthy AI agents with Amazon Bedrock AgentCore ... \- AWS, accessed October 25, 2025, [https://aws.amazon.com/blogs/machine-learning/build-trustworthy-ai-agents-with-amazon-bedrock-agentcore-observability/](https://aws.amazon.com/blogs/machine-learning/build-trustworthy-ai-agents-with-amazon-bedrock-agentcore-observability/)  
35. Amazon Bedrock AgentCore observability guide | genai-research – Weights & Biases, accessed October 25, 2025, [https://wandb.ai/onlineinference/genai-research/reports/Amazon-Bedrock-AgentCore-observability-guide--VmlldzoxMzc2OTI5Mg](https://wandb.ai/onlineinference/genai-research/reports/Amazon-Bedrock-AgentCore-observability-guide--VmlldzoxMzc2OTI5Mg)  
36. Facing Your Fears in AWS AgentCore Observability \- Tracking Malicious Behavior (and Poor Performance) | by Mary Becken | Oct, 2025 | Medium, accessed October 25, 2025, [https://medium.com/@mgbecken/facing-your-fears-in-aws-agentcore-observability-tracking-malicious-behavior-and-poor-bb21a2490fd0](https://medium.com/@mgbecken/facing-your-fears-in-aws-agentcore-observability-tracking-malicious-behavior-and-poor-bb21a2490fd0)  
37. Understand observability for agentic resources in AgentCore \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-telemetry.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-telemetry.html)  
38. aws/bedrock-agentcore-sdk-python: Python SDK for ... \- GitHub, accessed October 25, 2025, [https://github.com/aws/bedrock-agentcore-sdk-python](https://github.com/aws/bedrock-agentcore-sdk-python)  
39. Amazon Bedrock AgentCore, accessed October 25, 2025, [https://aws.github.io/bedrock-agentcore-starter-toolkit/](https://aws.github.io/bedrock-agentcore-starter-toolkit/)  
40. Integrate AgentCore Memory with LangChain or LangGraph \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-integrate-lang.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory-integrate-lang.html)  
41. CreateGateway \- Amazon Bedrock AgentCore Control Plane, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/API\_CreateGateway.html](https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/API_CreateGateway.html)  
42. Welcome \- Amazon Bedrock AgentCore Control Plane, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/Welcome.html](https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/Welcome.html)  
43. InvokeAgentRuntime \- Amazon Bedrock AgentCore Data Plane \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API\_InvokeAgentRuntime.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_InvokeAgentRuntime.html)  
44. ListMemoryRecords \- Amazon Bedrock AgentCore Data Plane \- AWS Documentation, accessed October 25, 2025, [https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API\_ListMemoryRecords.html](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_ListMemoryRecords.html)  
45. bedrock-agentcore — AWS CLI 2.31.21 Command Reference, accessed October 25, 2025, [https://docs.aws.amazon.com/cli/latest/reference/bedrock-agentcore/](https://docs.aws.amazon.com/cli/latest/reference/bedrock-agentcore/)  
46. AI Agents \- Amazon Bedrock \- AWS, accessed October 25, 2025, [https://aws.amazon.com/bedrock/agents/](https://aws.amazon.com/bedrock/agents/)  
47. AI エージェント – Amazon Bedrock エージェント – AWS, accessed October 25, 2025, [https://aws.amazon.com/jp/bedrock/agents/](https://aws.amazon.com/jp/bedrock/agents/)