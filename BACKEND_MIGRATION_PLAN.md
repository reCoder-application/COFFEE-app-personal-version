# バックエンド移行計画

このドキュメントは、reCoderアプリを「ブラウザ依存」から「サーバー保存」に移行するための計画です。

---

## 今の状態

現在、コーヒーの記録は **ブラウザのLocalStorage** に保存されています。

```
js/app.js の中：
- syncStorage() → データを保存する関数
- 初期化時 → localStorage.getItem() でデータを読み込む
```

**問題点：**
- 同じブラウザでしか見れない
- 別の端末（スマホ↔PC）でデータを共有できない
- ブラウザの履歴を消すとデータが消える可能性がある

---

## ゴール

- どの端末からでも同じデータが見れる
- ログイン機能でユーザーを区別する
- 将来のSNS機能への土台を作る

---

## サーバーの選択肢

### A. Firebase（おすすめ）

Googleが提供するサービス。`PERSONAL_VERSION_PLAN.md` でも想定されている。

**メリット：**
- ログイン機能（Google/メール）が簡単に作れる
- データベース（Firestore）も一緒に使える
- 日本語の情報が多い
- 無料枠が広い（個人利用なら十分）

**デメリット：**
- Googleのサービスに依存する
- 独自のやり方を覚える必要がある

### B. Supabase

オープンソースの「Firebaseの代わり」的なサービス。

**メリット：**
- PostgreSQL（よく使われるデータベース）が使える
- REST APIが自動で作られる
- Firebaseより「普通のサーバー開発」に近い

**デメリット：**
- Firebaseより日本語情報が少ない
- 無料枠はFirebaseより小さめ

### どちらを選ぶ？

→ **Firebase** がおすすめ。理由：
1. このプロジェクトの将来計画（SNS版）でFirebaseを使う予定
2. 日本語の情報が多くて学びやすい
3. 認証とデータベースがセットで使いやすい

---

## 実装ステップ

### ステップ1：コードの整理（準備）

**やること：** 保存処理を別ファイルに分ける

今は `app.js` の中に `syncStorage()` が直接書いてあります。
これを `api.js` という別ファイルに移して、後でサーバー用に差し替えやすくします。

**変更するファイル：**
- `js/api.js` → 新しく作る（保存・読み込みの関数）
- `js/app.js` → `syncStorage()` を削除して、`api.js` の関数を使う

**作る関数：**
```javascript
// js/api.js に作る関数たち

// すべてのログを読み込む
async function loadLogs() { ... }

// 新しいログを保存する
async function saveLog(log) { ... }

// ログを更新する
async function updateLog(log) { ... }

// ログを削除する
async function deleteLog(id) { ... }

// お気に入りを切り替える
async function toggleFavorite(id, isFavorite) { ... }
```

**ポイント：**
- `async` は「待つ処理がある」という意味
- サーバー通信は時間がかかるので、`async/await` を使う
- 最初はLocalStorageのままで動くように作る（動作確認用）

---

### ステップ2：Firebaseプロジェクトの作成

**やること：** Firebaseの管理画面でプロジェクトを作る

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：`recoder-app`）
4. Googleアナリティクスは「オフ」でOK
5. 作成完了

**次にやること：**
- 「ウェブアプリを追加」をクリック
- アプリ名を入力（例：`recoder-web`）
- 表示される設定情報（apiKeyなど）をメモする

---

### ステップ3：Firebaseの認証機能を有効にする

**やること：** ログイン方法を設定する

1. Firebaseコンソールで「Authentication」を開く
2. 「始める」をクリック
3. 「ログイン方法」タブを開く
4. 使いたい方法を有効にする：
   - **メール/パスワード** → 最初はこれだけでOK
   - **Google** → 後から追加してもいい

---

### ステップ4：Firestoreデータベースを作成

**やること：** データを保存する場所を作る

1. Firebaseコンソールで「Firestore Database」を開く
2. 「データベースを作成」をクリック
3. 「本番モード」を選択
4. ロケーションは「asia-northeast1（東京）」を選択

**データの構造（イメージ）：**
```
users（コレクション）
  └── ユーザーID（ドキュメント）
        └── logs（サブコレクション）
              ├── ログID1（ドキュメント）
              │     ├── productName: "エチオピア イルガチェフェ"
              │     ├── country: "エチオピア"
              │     ├── createdAt: "2026-05-19T..."
              │     └── ...その他のフィールド
              └── ログID2（ドキュメント）
                    └── ...
```

**セキュリティルール：**（最新の内容は `firestore.rules` を参照）
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
↑「ログインしている本人だけが、自分のデータを読み書きできる」というルール

`{document=**}` は「その下の階層すべて」を表す再帰ワイルドカード。
セキュリティルールは下の階層へ自動的には引き継がれないため、これを付けずに
`match /users/{userId}/logs/{logId}` と書くと、その下のサブコレクション
（抽出記録 `logs/{logId}/brews/{brewId}` など）が許可の記述が無い状態＝
アクセス拒否になり、詳細ページで `permission-denied` が発生する。

---

### ステップ5：HTMLにFirebaseを追加

**やること：** Firebaseを使うためのコードを読み込む

`index.html` の `</body>` の前に追加：

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore-compat.js"></script>

<!-- Firebase設定 -->
<script src="js/firebase-config.js"></script>

<!-- 認証とAPI -->
<script src="js/auth.js"></script>
<script src="js/api.js"></script>

<!-- メインアプリ -->
<script src="js/app.js"></script>
```

**新しく作るファイル：**
- `js/firebase-config.js` → Firebaseの設定情報
- `js/auth.js` → ログイン・ログアウトの処理

---

### ステップ6：ログイン画面を作る

**やること：** ログイン用のUIを追加

**必要なUI：**
- ログインフォーム（メールアドレス＋パスワード）
- 新規登録リンク
- ログアウトボタン（ヘッダーに追加）

**動作の流れ：**
1. アプリを開く
2. ログインしていなければ → ログイン画面を表示
3. ログインしたら → ホーム画面を表示
4. ログアウトしたら → ログイン画面に戻る

---

### ステップ7：api.jsをFirebase用に書き換える

**やること：** LocalStorageの代わりにFirestoreを使う

```javascript
// 例：ログを読み込む関数
async function loadLogs() {
  const user = firebase.auth().currentUser;
  if (!user) return [];
  
  const snapshot = await firebase.firestore()
    .collection('users')
    .doc(user.uid)
    .collection('logs')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

### ステップ8：既存データの移行

**やること：** 今ブラウザにあるデータをサーバーに引っ越す

**方法：**
1. 初回ログイン時にLocalStorageをチェック
2. データがあれば、1件ずつFirestoreに保存
3. 保存が完了したら、LocalStorageを削除（または移行済みフラグを立てる）

---

### ステップ9：エラー処理とローディング表示

**やること：** 使いやすさを改善

- 読み込み中は「読み込み中...」と表示
- 保存に失敗したらエラーメッセージを表示
- ネットワークエラーの対処

---

## 注意点：IDの変更

**今の状態：**
- `id: Date.now()` で、タイムスタンプをIDとして使っている
- 日付表示にも `log.id` を使っている

**変更後：**
- IDはFirestoreが自動で作る（ランダムな文字列）
- 日付は `createdAt` という別のフィールドで保存する

**変更が必要な場所：**
- `logDate(log.id)` → `logDate(log.createdAt)` に変更
- カードの `data-id` はそのままでOK（新しいIDを使う）

---

## ファイル一覧（完成後）

```
COFFEE-app/
├── index.html              # ログイン画面を追加
├── js/
│   ├── app.js             # メインロジック（syncStorage削除）
│   ├── api.js             # データ操作（Firestore版）
│   ├── auth.js            # ログイン・ログアウト処理
│   ├── firebase-config.js # Firebase設定
│   └── modal.js           # カスタムモーダル（変更なし）
├── styles/
│   ├── main.css           # メインスタイル
│   ├── modal.css          # モーダルスタイル
│   ├── auth.css           # ログイン画面のスタイル（新規）
│   └── responsive.css     # レスポンシブデザイン
└── ...
```

---

## チェックリスト

### 準備
- [ ] Firebaseを使うか決める
- [ ] Firebaseプロジェクトを作成する

### ステップ1：コード整理
- [ ] `js/api.js` に関数を作る（LocalStorage版）
- [ ] `js/app.js` から `syncStorage()` を削除
- [ ] `app.js` で `api.js` の関数を使うように変更
- [ ] 動作確認（今まで通り動くか）

### ステップ2-4：Firebase設定
- [ ] Firebaseコンソールでプロジェクト作成
- [ ] Authentication（認証）を有効化
- [ ] Firestoreを作成
- [ ] セキュリティルールを設定

### ステップ5-6：認証機能
- [ ] `index.html` にFirebase SDKを追加
- [ ] `js/firebase-config.js` を作成
- [ ] `js/auth.js` を作成
- [ ] ログイン画面のHTMLを追加
- [ ] `styles/auth.css` を作成

### ステップ7：Firestore接続
- [ ] `api.js` をFirestore版に書き換え
- [ ] 動作確認

### ステップ8：データ移行
- [ ] 移行処理を実装
- [ ] テスト

### ステップ9：仕上げ
- [ ] ローディング表示を追加
- [ ] エラー処理を追加
- [ ] 全体テスト

---

## 参考リンク

- [Firebase 公式ドキュメント（日本語）](https://firebase.google.com/docs?hl=ja)
- [Firestore 入門](https://firebase.google.com/docs/firestore/quickstart?hl=ja)
- [Firebase Authentication](https://firebase.google.com/docs/auth?hl=ja)

---

**作成日**: 2026年5月19日
