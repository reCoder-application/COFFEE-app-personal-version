# BeanJournal Personal - 個人用版実装計画

## 📋 プロジェクト概要

このドキュメントは、BeanJournal Personal（個人用コーヒー記録アプリ）の実装計画をまとめたものです。
別のCursorプロジェクトで本ドキュメントを参照し、個人用版の開発を進めてください。

**重要**：このリポジトリは今後、ミニSNSバージョンの開発に使用されます。

---

## 🎯 プロジェクトの位置づけ

### 戦略
1. **Phase 1（個人用版）**：LocalStorageを使った個人記録アプリとしてリリース
2. **Phase 2（SNS版）**：Firebaseを使ったミニSNSアプリとして新規開発（このリポジトリで継続）

### 個人用版の特徴
- 完全プライベート（LocalStorageで管理）
- サーバー不要、完全無料
- シンプルで軽量
- プライバシー重視

---

## 📂 現在のファイル構成

```
COFFEE-app/
├── index.html              # メインHTML
├── styles/
│   ├── main.css           # メインスタイル
│   ├── modal.css          # モーダルスタイル
│   └── responsive.css     # レスポンシブデザイン（スマホ・タブレット対応）
├── js/
│   ├── app.js             # メインロジック（370行、リファクタリング済み）
│   └── modal.js           # カスタムモーダル
├── README.md              # プロジェクト説明
├── PROJECT_STATUS.md      # 進捗管理
└── FUTURE_FEATURES.md     # 将来の機能拡張案

```

---

## ✅ 現在の実装済み機能

### 基本機能
1. **コーヒーログの追加**
   - 商品名、生産国、農園、品種、風味、プロセス、ドリッパー、購入店
   - 5項目の風味プロファイル（酸味、苦味、コク、甘味、香り）
   - レーダーチャート表示（Chart.js）

2. **編集機能**
   - 既存のログを編集
   - フォームに元データを表示

3. **削除機能**
   - カスタムモーダルで確認
   - 削除実行

4. **いいね機能**（削除予定）
   - 現在実装されているが、個人用には不要
   - お気に入り機能に置き換える

5. **LocalStorageでの保存**
   - ブラウザにデータを永続化
   - ページをリロードしてもデータが残る

6. **レスポンシブデザイン**
   - スマホ（767px以下）：縦積みレイアウト
   - タブレット（768px〜1023px）：横並びレイアウト
   - iOS自動ズーム防止

7. **リファクタリング済み**
   - コードを5つのセクションに整理
     1. 変数定義
     2. UI操作関数
     3. データ処理関数
     4. イベントリスナー
     5. 初期化処理
   - `switchPage()`, `syncStorage()`, `initChart()`, `resetForm()` など共通関数化

---

## 🔄 必要な変更（優先度順）

### 🔴 最優先：今すぐ実装

#### 1. いいね機能の削除
**理由**：個人用アプリに「いいね」は不自然

**削除対象**：

##### [`js/app.js`](js/app.js)
- `likes` プロパティの削除（224行目あたり）
```javascript
// 削除
likes: 0,
```

- いいねボタンのイベントリスナー削除（312〜348行目あたり）
```javascript
// 削除
else if (likeBtn) {
    // ... いいね処理のコード全体
}
```

- 初期化時のいいね数復元処理を削除（renderCard内）

##### [`js/app.js`](js/app.js) - `renderCard()` 関数
```javascript
// 削除
<button class="action-btn like-btn" data-id="${log.id}">
    <i data-lucide="thumbs-up"></i>
    <span class="like-count">0</span>
</button>
```

##### [`styles/main.css`](styles/main.css)
```css
/* 削除 */
.like-btn.active {
    color: var(--primary);
}

.like-btn.active i{
    fill: var(--primary)
}
```

---

#### 2. お気に入り機能の追加

**目的**：特に気に入ったコーヒーをマークする

**実装内容**：

##### データ構造の変更
[`js/app.js`](js/app.js) のログオブジェクトに追加：
```javascript
const log = {
    id: Date.now(),
    productName: productName,
    // ... 他のフィールド
    isFavorite: false,  // 追加
    flavor: { ... }
};
```

##### UI変更（`renderCard()` 関数）
```javascript
<div class="card-footer">
    <button class="action-btn favorite-btn ${log.isFavorite ? 'active' : ''}" data-id="${log.id}">
        <i data-lucide="star"></i>
        <span>${log.isFavorite ? 'お気に入り' : 'お気に入りに追加'}</span>
    </button>
    <button class="action-btn edit-btn" data-id="${log.id}">
        <i data-lucide="edit"></i>
    </button>
    <button class="action-btn delete-btn" data-id="${log.id}">
        <i data-lucide="trash-2"></i>
    </button>
</div>
```

##### イベントリスナー追加
```javascript
cardArea.addEventListener('click', function(e) {
    const favoriteBtn = e.target.closest('.favorite-btn');
    
    if (favoriteBtn) {
        const favoriteId = Number(favoriteBtn.dataset.id);
        const targetLog = coffeeLogs.find(log => log.id === favoriteId);
        
        if (targetLog) {
            targetLog.isFavorite = !targetLog.isFavorite;
            syncStorage();
            
            // カードを再描画
            const oldCard = document.querySelector(`[data-id="${favoriteId}"]`).closest('.glass-card');
            if (oldCard) {
                oldCard.remove();
            }
            renderCard(targetLog);
        }
    }
    
    // ... 他のボタン処理
});
```

##### CSSスタイル追加（`styles/main.css`）
```css
.favorite-btn.active {
    color: var(--primary);
}

.favorite-btn.active i {
    fill: var(--primary);
}
```

---

#### 3. 飲んだ日付の表示

**目的**：いつ飲んだかを記録

**実装内容**：

##### データ構造（すでに `id: Date.now()` で保存されている）
```javascript
// idをタイムスタンプとして利用
const log = {
    id: Date.now(),  // これが日付
    // ...
};
```

##### 日付フォーマット関数の追加（`js/app.js`）
```javascript
// ========================================
// 2. UI操作関数
// ========================================

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}
```

##### `renderCard()` 関数で日付を表示
```javascript
<div class="card-header">
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3>${displayName}</h3>
            <button class="action-btn edit-btn" data-id="${log.id}">
                <i data-lucide="edit"></i>
            </button>
        </div>
        
        <!-- 日付を表示 -->
        <div class="meta-info" style="margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 0.85rem;">
                <i data-lucide="calendar"></i> ${formatDate(log.id)}
            </span>
        </div>
        
        <div class="meta-info">
            <span><i data-lucide="map-pin"></i> ${log.country}</span>
            <!-- 以下同じ -->
```

---

### 🟡 中優先：デプロイ後に追加

#### 4. 5段階評価機能

**目的**：コーヒーの総合評価を記録

**実装案**：

##### 入力フォームに追加（`index.html`）
```html
<div class="form-group">
    <label>総合評価</label>
    <div class="star-rating">
        <span class="star" data-rating="1">☆</span>
        <span class="star" data-rating="2">☆</span>
        <span class="star" data-rating="3">☆</span>
        <span class="star" data-rating="4">☆</span>
        <span class="star" data-rating="5">☆</span>
    </div>
    <input type="hidden" id="rating" value="3">
</div>
```

##### JavaScriptで星評価の選択機能
```javascript
let selectedRating = 3;

document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = Number(this.dataset.rating);
        updateStarDisplay();
    });
});

function updateStarDisplay() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < selectedRating) {
            star.textContent = '★';
            star.style.color = 'var(--primary)';
        } else {
            star.textContent = '☆';
            star.style.color = 'var(--text-muted)';
        }
    });
}
```

##### データ構造に追加
```javascript
const log = {
    // ... 他のフィールド
    rating: selectedRating,  // 追加
};
```

##### カード表示
```javascript
<div class="card-header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>${displayName}</h3>
        <div class="rating">
            ${'★'.repeat(log.rating)}${'☆'.repeat(5 - log.rating)}
        </div>
    </div>
    <!-- 以下同じ -->
```

---

#### 5. 簡易統計機能

**目的**：記録の傾向を可視化

**実装案**：

##### 新しいページを追加（`index.html`）
```html
<section id="stats-page" class="hidden">
    <div class="glass-card">
        <h2>統計</h2>
        
        <div class="stat-item">
            <span class="stat-label">総記録数</span>
            <span class="stat-value" id="total-count">0</span>
        </div>
        
        <div class="stat-item">
            <span class="stat-label">今月の記録</span>
            <span class="stat-value" id="this-month-count">0</span>
        </div>
        
        <div class="stat-item">
            <span class="stat-label">一番多い生産国</span>
            <span class="stat-value" id="top-country">-</span>
        </div>
        
        <div class="stat-item">
            <span class="stat-label">お気に入り数</span>
            <span class="stat-value" id="favorite-count">0</span>
        </div>
    </div>
</section>
```

##### ヘッダーに統計ボタンを追加
```html
<header class="glass-header">
    <div class="logo">
        <i data-lucide="coffee"></i>
        <span>BeanJournal</span>
    </div>
    <button id="stats-btn" class="action-btn">
        <i data-lucide="bar-chart-2"></i>
    </button>
</header>
```

##### 統計計算関数（`js/app.js`）
```javascript
function calculateStats() {
    const totalCount = coffeeLogs.length;
    
    // 今月の記録
    const now = new Date();
    const thisMonthCount = coffeeLogs.filter(log => {
        const logDate = new Date(log.id);
        return logDate.getMonth() === now.getMonth() && 
               logDate.getFullYear() === now.getFullYear();
    }).length;
    
    // 一番多い生産国
    const countryCount = {};
    coffeeLogs.forEach(log => {
        countryCount[log.country] = (countryCount[log.country] || 0) + 1;
    });
    const topCountry = Object.keys(countryCount).reduce((a, b) => 
        countryCount[a] > countryCount[b] ? a : b, '-'
    );
    
    // お気に入り数
    const favoriteCount = coffeeLogs.filter(log => log.isFavorite).length;
    
    return { totalCount, thisMonthCount, topCountry, favoriteCount };
}

function showStatsPage() {
    const stats = calculateStats();
    
    document.getElementById('total-count').textContent = stats.totalCount;
    document.getElementById('this-month-count').textContent = stats.thisMonthCount;
    document.getElementById('top-country').textContent = stats.topCountry;
    document.getElementById('favorite-count').textContent = stats.favoriteCount;
    
    switchPage('stats');
}
```

---

### 🟢 低優先：ユーザーの声を聞いてから

#### 6. タグ機能
- コーヒーに自由なタグを付ける
- 例：「朝用」「リラックス」「仕事中」
- タグでフィルタリング

#### 7. メモ機能
- 各コーヒーに自由なメモを追加
- 例：「豆の挽き方: 中挽き」「抽出温度: 90℃」

#### 8. 検索・ソート機能
- 商品名、生産国で検索
- 日付順、評価順で並び替え
- お気に入りだけ表示

---

## 🛠️ 技術スタック

### フロントエンド
- **HTML5**
- **CSS3**（カスタムプロパティ、Flexbox、Glassmorphism）
- **Vanilla JavaScript (ES6+)**
- **Chart.js 3.x**（レーダーチャート）
- **Lucide Icons**（SVGアイコン）
- **Google Fonts**（Outfit）

### データ管理
- **LocalStorage API**

### デプロイ
- **GitHub Pages**（予定）

---

## 📋 実装の優先順位

### 今すぐ実装（今日〜明日）
1. ✅ いいね機能の削除
2. ⭐ お気に入り機能の追加
3. 📅 日付表示の追加
4. 📝 README.mdの更新（Personal版としての説明）

### 近日中（今週）
5. ⭐⭐⭐⭐⭐ 5段階評価機能
6. 🧪 動作確認とバグ修正
7. 🚀 デプロイ（GitHub Pages）

### 中期（1〜2週間）
8. 📊 統計ダッシュボード
9. 👥 友達にテストしてもらう
10. 🔄 フィードバックを反映

### 長期（必要に応じて）
11. 🏷️ タグ機能
12. 📝 メモ機能
13. 🔍 検索・ソート機能

---

## 🚀 デプロイまでのチェックリスト

### コード整理
- [ ] デバッグ用 `console.log()` の削除
- [ ] 未使用コメントの削除
- [ ] コードの最終チェック

### ドキュメント
- [ ] README.md の更新
  - アプリの説明（個人用版）
  - 使い方
  - 技術スタック
  - ローカルでの起動方法
- [ ] PROJECT_STATUS.md の更新
  - 完了した機能をマーク
  - バージョン1.0.0

### テスト
- [ ] すべての機能の動作確認
- [ ] 複数デバイスでの表示確認
  - スマホ（375px、390px、360px）
  - タブレット（768px、1024px）
  - デスクトップ（1280px、1920px）
- [ ] ブラウザ互換性確認
  - Chrome
  - Safari（iOS含む）
  - Firefox
  - Edge

### デプロイ
- [ ] GitHubにプッシュ
- [ ] GitHub Pages有効化
- [ ] デプロイURL確認
- [ ] 実機での動作確認

---

## 📝 README.md のテンプレート

```markdown
# BeanJournal Personal

あなたのコーヒー体験を記録する個人用アプリ

## 特徴

- 完全プライベート（LocalStorage使用）
- サーバー不要、完全無料
- スマホ・タブレット対応
- お気に入り機能
- レーダーチャートで風味を可視化
- カスタムモーダル

## 使い方

1. 「+」ボタンで新しいコーヒーを記録
2. 必須項目を入力
3. 風味プロファイルをスライダーで調整
4. 保存

## 技術スタック

- HTML5 / CSS3 / Vanilla JavaScript
- Chart.js（レーダーチャート）
- Lucide Icons
- LocalStorage API

## ローカルでの起動

```bash
# リポジトリをクローン
git clone https://github.com/nagisa-oda/COFFEE-app-personal.git

# ブラウザで index.html を開く
# または Live Server を使用
```

## 将来の展望

BeanJournal SNS版を開発予定
- コミュニティでコーヒー体験を共有
- おすすめコーヒーの発見
- フォロー機能

## ライセンス

MIT License
```

---

## 🔗 関連ドキュメント

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) - 進捗管理
- [`FUTURE_FEATURES.md`](FUTURE_FEATURES.md) - 将来の機能拡張案
- [`PERSONAL_VERSION_PLAN.md`](PERSONAL_VERSION_PLAN.md) - このドキュメント

---

## 📞 連絡先

実装中に不明点があれば、元のプロジェクトの開発者に確認してください。

---

**最終更新**: 2026年1月24日
**バージョン**: 1.0.0-planning
