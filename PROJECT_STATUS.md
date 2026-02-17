# BeanJournal Personal - 開発進捗とロードマップ

## 📊 プロジェクト概要

**アプリ名**: BeanJournal Personal  
**バージョン**: v1.0 (個人用版)  
**目的**: コーヒー豆のテイスティング記録・管理アプリ  
**開発スタイル**: フレームワークなし（Vanilla JS）、個人開発の練習  
**現在の状態**: ✅ **デプロイ準備完了**

---

## ✅ 完了した機能

### Phase 1-2: 基本機能構築 ✅
**完了日**: 2025年12月頃

#### 実装済み機能
- [x] HTML/CSS/JSの基本構造
- [x] ガラスモーフィズムUIデザイン（ダークテーマ）
- [x] コーヒー記録の新規追加（Create）
- [x] LocalStorageでのデータ永続化
- [x] カード一覧表示（Read）
- [x] 削除機能（Delete、確認ダイアログ付き）
- [x] 画面遷移（ホーム画面 ⇔ 入力画面）

---

### Phase 3: 味の見える化（レーダーチャート） ✅
**完了日**: 2025年12月30日頃

#### 実装内容

**1. 入力フォームに5段階スライダー追加**
- 酸味（Acidity）: 1-5
- 苦味（Bitterness）: 1-5
- コク（Body）: 1-5
- 甘み（Sweetness）: 1-5
- 香り（Aroma）: 1-5

**2. リアルタイム値表示**
- スライダー操作で数値がリアルタイムに更新
- forEachでスライダーをまとめて管理

**3. Chart.jsでレーダーチャート実装**
- 5角形のフレーバープロファイル
- ゴールドカラー（#d4af37）で統一
- ダークテーマに最適化
- レスポンシブ対応（スマホ・PC両対応）

**4. データ構造拡張**
```javascript
log = {
    id: Number,              // Date.now()で生成（購入日も兼ねる）
    productName: String,     // 商品名（旧beanName）
    country: String,         // 生産国
    farm: String,            // 農園
    variety: String,         // 品種
    aroma: String,           // 風味・感想
    process: String,         // プロセス（ウォッシュド等）
    dripper: String,         // ドリッパー（V60等）
    shop: String,            // 購入店
    note: String,            // その他メモ
    isFavorite: Boolean,     // お気に入りフラグ
    flavor: {
        acidity: Number,        // 酸味 (1-5)
        bitterness: Number,     // 苦味 (1-5)
        richness: Number,       // コク (1-5)
        sweetness: Number,      // 甘み (1-5)
        aromaStrength: Number   // 香り (1-5)
    }
}
```

---

### Phase 4: 編集機能（Update完全化） ✅
**完了日**: 2026年1月頃

#### 実装内容
- [x] カードに編集ボタン追加（鉛筆アイコン）
- [x] 編集ボタン押下時の処理
  - 入力画面へ遷移
  - フォームに既存データを表示
  - スライダーの値も復元
- [x] 保存時の判定ロジック
  - `editingId`グローバル変数で編集中IDを管理
  - IDがあれば「更新」、なければ「新規」
- [x] 配列内のデータ更新処理
- [x] フォームリセット機能（`resetForm()`）

#### 実装のポイント
```javascript
// 編集中IDを保持するグローバル変数
let editingId = null;

// 編集ボタン押下時
const targetLog = coffeeLogs.find(log => log.id === targetId);
document.getElementById('product-name').value = targetLog.productName;
// ... 他の項目も同様

// 保存時
if (editingId) {
    // 更新処理
    const index = coffeeLogs.findIndex(log => log.id === editingId);
    log.id = editingId;
    log.isFavorite = coffeeLogs[index].isFavorite; // お気に入り状態を保持
    coffeeLogs[index] = log;
} else {
    // 新規追加
    coffeeLogs.push(log);
}
```

#### 学習したこと
- 状態管理（editingId）
- findとfindIndexの使い分け
- CRUD操作の完成（Create, Read, Update, Delete）
- データの再利用

---

### Phase 5: 検索・並び替え機能 ⏸️
**状態**: スキップ（必要に応じて将来実装）

現時点では検索・ソート機能は必須ではないと判断し、Phase 6のUI/UX改善を優先しました。  
将来的にデータ数が増えた際に実装予定です（FUTURE_FEATURES.mdに記載）。

---

### Phase 6: UI/UXの仕上げ ✅
**完了日**: 2026年2月頃

#### 実装内容

**1. アニメーション追加** ✅
- カード表示時のフェードインアニメーション（fadeInUp）
- ボタンホバーエフェクト

```css
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.glass-card {
    animation: fadeInUp 0.5s ease forwards;
}
```

**2. カスタムモーダルウィンドウ** ✅
- `window.confirm()`をカスタムモーダルに置き換え
- `modal.js`と`modal.css`に分離
- コールバック関数で動的な処理を実現

```javascript
// modal.jsの実装
function openModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    currentConfirmAction = onConfirm;
    customModal.classList.remove('hidden');
}
```

**3. レスポンシブデザインの強化** ✅
- `responsive.css`を新規作成して分離
- モバイルファースト設計
- タブレット対応（768px〜1023px）
- スマホ対応（〜767px）
  - フォームの縦積み
  - スライダー値の配置調整
  - ボタンサイズの最適化（タッチターゲット）
  - お気に入りボタンのテキスト非表示（アイコンのみ）

**4. お気に入り機能** ✅
- 「いいね機能」を「お気に入り機能」に変更（個人用アプリに最適化）
- ワンタップでON/OFF切り替え
- カード再描画なしで状態を更新（パフォーマンス向上）
- Lucideの`star`アイコンを使用

**5. 日付表示機能** ✅
- 各カードに購入日を表示
- `log.id`（タイムスタンプ）を`YYYY/MM/DD`形式に変換
- `logDate()`関数を実装

```javascript
function logDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}
```

**6. メモ欄表示機能** ✅
- 「その他メモ」欄をカードに表示
- アイコン（sticky-note）付きの専用スタイル
- 未入力時は「メモなし」と表示

#### 学習したこと
- CSSアニメーション（@keyframes）
- モジュール分割（modal.js/modal.css）
- コールバック関数の実装
- レスポンシブデザインの実践（メディアクエリ）
- イベントバブリングとイベント委譲
- 状態管理の最適化

---

## 🛠️ コードリファクタリング

### app.jsの構造化
**実施日**: 2026年1月頃

ファイルが長くなったため、以下の4つのセクションに整理：

1. **変数定義**: DOM要素、データ配列、設定値
2. **UI操作関数**: `renderCard()`, `switchPage()`, `initChart()`, `resetForm()`, `logDate()`
3. **データ処理関数**: `syncStorage()`
4. **イベントリスナー**: ボタンクリック、スライダー入力、カードアクション
5. **初期化処理**: LocalStorageからのデータ読み込み

---

## 📋 今後の実装候補（FUTURE_FEATURES.md参照）

### 優先度: 高
- [ ] 検索・フィルタリング機能
- [ ] 並び替え機能（日付順、お気に入り順、名前順）
- [ ] データエクスポート/インポート機能（JSON形式）

### 優先度: 中
- [ ] 統計・分析機能（月別グラフ、平均風味プロファイル）
- [ ] タグ機能（カスタムタグで分類）
- [ ] 写真添付機能（画像アップロード）

### 優先度: 低
- [ ] トースト通知（保存完了メッセージ）
- [ ] リマインダー機能（豆の消費期限）
- [ ] ダークモード/ライトモード切り替え

---

## 🚀 Phase 7-8: 将来の展望（別プロジェクト）

### ミニSNS版「BeanJournal Social」
現在の「Personal版」とは別に、将来的にSNS機能を持つバージョンを開発予定。

#### 主な違い
| 機能 | Personal版（このリポジトリ） | Social版（将来） |
|------|---------------------------|-----------------|
| データ保存 | LocalStorage（端末内） | Firebase Firestore（クラウド） |
| 認証 | なし | Firebase Authentication |
| 共有 | 不可 | ユーザー間で共有可能 |
| いいね | お気に入り（個人用） | いいね（ソーシャル） |
| コメント | なし | あり |
| フォロー | なし | あり |

詳細は [PERSONAL_VERSION_PLAN.md](./PERSONAL_VERSION_PLAN.md) を参照。

---

## 🛠️ 技術スタック

### 現在使用中
- **HTML5**: セマンティックHTML
- **CSS3**: 
  - カスタムプロパティ（CSS変数）
  - Flexbox
  - ガラスモーフィズム
  - レスポンシブデザイン
  - CSSアニメーション
- **JavaScript ES6+**:
  - アロー関数
  - テンプレートリテラル
  - 分割代入
  - forEach, filter, find, findIndex, map
  - addEventListener（イベント委譲）
  - LocalStorage API
  - Date オブジェクト
- **外部ライブラリ**:
  - [Chart.js](https://www.chartjs.org/)（レーダーチャート）
  - [Lucide Icons](https://lucide.dev/)（SVGアイコン）
  - [Google Fonts](https://fonts.google.com/)（Outfit）

### 将来導入予定（Social版）
- **Firebase**:
  - Firestore（データベース）
  - Authentication（認証）
- **PWA技術**:
  - Service Worker
  - Web App Manifest
- **デプロイ**:
  - Vercel または Netlify または GitHub Pages

---

## 📈 学習の進捗

### 習得済みスキル ✅
- DOM操作（getElementById, querySelector, closest, insertAdjacentHTML等）
- イベント処理（addEventListener、イベント委譲、event.target）
- データ永続化（LocalStorage）
- 配列操作（forEach, filter, find, findIndex, push, map）
- オブジェクト指向的なデータ管理
- 外部ライブラリの統合
- レスポンシブデザインの実践
- CSSアニメーション
- モジュール分割（JS/CSS）
- 状態管理（editingId, currentConfirmAction）
- コールバック関数
- デバッグとエラー対応
- 防御的プログラミング
- gitによるバージョン管理

### 次に学ぶスキル 📚
- 高度な配列操作（sort, reduce）
- 非同期処理（async/await, Promise）
- Firebase連携
- PWA実装
- デプロイとCI/CD

---

## 🎯 開発の目標

### 短期目標 ✅ **達成**
- [x] CRUD操作の完全実装
- [x] 実用的な編集・削除機能の完成
- [x] 基本的なWebアプリの完成形

### 中期目標 ✅ **達成**
- [x] プロフェッショナルなUI/UX
- [x] カスタムモーダル実装
- [x] レスポンシブデザイン対応
- [x] 実務レベルのフロントエンド技術習得

### 長期目標（Social版で実現予定）
- [ ] Firebase連携によるクラウド化
- [ ] 認証機能の実装
- [ ] 本番環境へのデプロイ
- [ ] PWA化によるアプリ体験の向上

---

## 📝 開発で学んだこと・つまずいたポイント

### Phase 3で学んだこと
- **forEachの活用**: 繰り返し処理をまとめることでコードがDRY（Don't Repeat Yourself）になる
- **防御的プログラミング**: データ構造が変わった時のエラー対応の重要性
- **Chart.jsの設定**: optionsの構造が深い（scales.r.ticks...）ので、公式ドキュメントを参照しながら調整
- **レスポンシブチャート**: canvasの親要素でサイズを制御するのがコツ

### Phase 4で学んだこと
- **状態管理の重要性**: `editingId`で新規/編集モードを切り替える
- **find vs findIndex**: データ取得には`find`、更新には`findIndex`
- **フォームのリセット**: キャンセル時や保存後にフォームを初期化する必要性

### Phase 6で学んだこと
- **イベント委譲**: カードが動的に追加されるため、親要素にイベントリスナーを設置
- **コールバック関数**: モーダルの確認処理を動的に変更する仕組み
- **レスポンシブ設計**: モバイルファーストで設計し、段階的にタブレット・デスクトップを対応
- **パフォーマンス最適化**: カード全体を再描画せず、必要な部分だけ更新

### つまずいたポイントと解決策
1. **HTMLの構文エラー**: 閉じタグやクォートの不一致 → 慎重なコードレビュー
2. **editingIdのリセット忘れ**: キャンセル時にリセットしないとバグが発生 → `resetForm()`で統一
3. **モーダルのDOM読み込みタイミング**: `modal.js`が先に読み込まれてエラー → HTML内でモーダルをスクリプトより前に配置
4. **スライダー値の配置（モバイル）**: `:has()`セレクタの互換性問題 → クラスベースのスタイル設定に変更
5. **お気に入りボタンのカード並び替え**: カード再描画で順序が変わる → 再描画せずにクラスとテキストのみ更新

---

## 📅 開発履歴

- **Phase 1-2完了**: 2025年12月頃 - 基本CRUD機能（Create, Read, Delete）
- **Phase 3完了**: 2025年12月30日頃 - レーダーチャート実装
- **Phase 4完了**: 2026年1月頃 - 編集機能（Update）実装
- **Phase 5**: スキップ（将来実装）
- **Phase 6完了**: 2026年2月頃 - UI/UX改善、レスポンシブ対応
- **現在**: 2026年2月 - **デプロイ準備完了、v1.0リリース予定**

---

## 🔗 参考リソース

- [Chart.js 公式ドキュメント](https://www.chartjs.org/)
- [Lucide Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Google Fonts](https://fonts.google.com/)

---

**最終更新**: 2026年2月17日  
**バージョン**: v1.0 (Personal版デプロイ準備完了)
