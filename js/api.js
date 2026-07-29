// ========================================
// Firestore(データベース)との読み書きをまとめたファイル
//
// データ構造は「豆」と「抽出記録」の2階層になっている。
//   users/{uid}/logs/{beanId}             … コーヒー豆そのものの情報
//   users/{uid}/logs/{beanId}/brews/{id}  … その豆で淹れた1回分の抽出記録
//
// サブコレクション: あるドキュメントの下にぶら下がるコレクションのこと。
// 豆1件に対して抽出記録を何件でも紐づけられる。
// ========================================

function getLogsCollection() {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    return firebase.firestore()
     .collection('users')
     .doc(user.uid) // uid = ユーザ識別用固有ID
     .collection('logs'); 
}

// 全てのログを読み込む
// async: 処理に時間を要する関数に用いる
// サーバとの通信には時間がかかるため、async/awaitを用いる。
async function loadLogs() {
    const logsRef = getLogsCollection(); // ログの参照を格納
    if (!logsRef) return [];

    // orderBy('createdAt') で古い順に並べて取得
    const snapshot = await logsRef.orderBy('createdAt').get(); // snapshot: ...get()で帰ってくる取得結果の塊。その中の.docsで1件ずつ取り出せる

    // snapshot.docs = 取得した全ドキュメント。1件ずつ扱いやすい形に変換する
    return snapshot.docs.map(doc => ({
        id: doc.id, // ドキュメントID(文字列)をidとして持たせる
        ...doc.data() // 中身を展開する
    }));
}

// IDを指定して豆1件だけを読み込む(詳細ページやフォームで使う)
// 見つからない場合はnullを返す
async function loadLog(beanId) {
    const logsRef = getLogsCollection();
    if (!logsRef || !beanId) return null;

    const doc = await logsRef.doc(beanId).get();
    if (!doc.exists) return null; // doc.exists でデータの有無を判定できる

    return { id: doc.id, ...doc.data() };
}

// 新しいログを保存する(保存後、firestoreが作ったIDを返す)
async function saveLog(log) {
    const logsRef = getLogsCollection();
    if (!logsRef) return null;
    const docRef = await logsRef.add(log); //add = 新規追加(IDは自動生成)
    return docRef.id;
};

// 既存のログを更新する
async function updateLog(id, log) {
    const logsRef = getLogsCollection();
    if (!logsRef) return ;
    await logsRef.doc(id).update(log); // doc(id)で1件を指定してupdateする
};

// ログを削除する
async function deleteLog(id) {
    const logsRef = getLogsCollection();
    if(!logsRef) return;

    // Firestoreでは、親ドキュメントを消してもサブコレクションは自動では消えない。
    // そのため、先に抽出記録を1件ずつ削除してから豆本体を削除する。
    const brewsSnapshot = await logsRef.doc(id).collection('brews').get();
    // Promise.all: 複数の非同期処理をまとめて実行し、全部終わるのを待つ
    await Promise.all(brewsSnapshot.docs.map(doc => doc.ref.delete()));

    await logsRef.doc(id).delete();
};

// お気に入りを切り替える(Firestoreだけ更新する)
async function toggleFavorite(id, isFavorite) {
    const logsRef  = getLogsCollection();
    if (!logsRef) return;
    await logsRef.doc(id).update({ isFavorite: isFavorite });
};


// ========================================
// 抽出記録(brews)の読み書き
// ========================================

// 指定した豆に紐づく抽出記録コレクションの参照を取得する
function getBrewsCollection(beanId) {
    const logsRef = getLogsCollection();
    if (!logsRef || !beanId) return null;
    return logsRef.doc(beanId).collection('brews');
}

// 指定した豆の抽出記録を全件読み込む(抽出日の新しい順に並べて返す)
async function loadBrews(beanId) {
    const brewsRef = getBrewsCollection(beanId);
    if (!brewsRef) return [];

    // Firestoreのorderbyは対象フィールドを持たないデータを除外してしまうため、
    // 取得はそのまま行い、並び替えはJavaScript側で行う
    const snapshot = await brewsRef.get();
    const brews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return brews.sort((a, b) => (b.brewedAt || 0) - (a.brewedAt || 0));
}

// IDを指定して抽出記録1件だけを読み込む(編集フォームで使う)
async function loadBrew(beanId, brewId) {
    const brewsRef = getBrewsCollection(beanId);
    if (!brewsRef || !brewId) return null;

    const doc = await brewsRef.doc(brewId).get();
    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() };
}

// 新しい抽出記録を保存する(保存後、FirestoreがつくったIDを返す)
async function saveBrew(beanId, brew) {
    const brewsRef = getBrewsCollection(beanId);
    if (!brewsRef) return null;
    const docRef = await brewsRef.add(brew);
    return docRef.id;
}

// 既存の抽出記録を更新する
async function updateBrew(beanId, brewId, brew) {
    const brewsRef = getBrewsCollection(beanId);
    if (!brewsRef) return;
    await brewsRef.doc(brewId).update(brew);
}

// 抽出記録を1件削除する
async function deleteBrew(beanId, brewId) {
    const brewsRef = getBrewsCollection(beanId);
    if (!brewsRef) return;
    await brewsRef.doc(brewId).delete();
}
