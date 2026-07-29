// ========================================
// 豆情報の入力画面(bean-form.html)専用の処理
//
// URLに ?id=豆のID が付いていれば編集、付いていなければ新規登録として動く。
//   新規登録: bean-form.html
//   編集    : bean-form.html?id=abc123
// ========================================

const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const saveBtn = document.getElementById('btn-save');
const cancelBtn = document.getElementById('btn-cancel');

// 入力欄のid一覧。リセットや読み取りでまとめて扱う
const BEAN_FIELD_IDS = ['product-name', 'country', 'process', 'variety', 'roastLevel', 'aroma', 'farm', 'shop', 'memo'];

// 編集対象の豆のID(nullなら新規登録)
const editingId = getQueryParam('id');

// 編集中の豆のデータ(新規登録の場合はnull)
let editingBean = null;

// 二重送信を防ぐための目印
let isSaving = false;


// ========================================
// 1. フォームの表示
// ========================================

// 既存の豆のデータを入力欄へ流し込む
function fillForm(bean) {
    document.getElementById('product-name').value = bean.productName || bean.beanName || '';
    document.getElementById('country').value = bean.country || '';
    document.getElementById('process').value = bean.process || '';
    document.getElementById('variety').value = bean.variety || '';
    document.getElementById('roastLevel').value = bean.roastLevel || '';
    document.getElementById('aroma').value = bean.aroma || '';
    document.getElementById('farm').value = bean.farm || '';
    document.getElementById('shop').value = bean.shop || '';
    document.getElementById('memo').value = bean.note || '';
}

// 入力欄の値をまとめて読み取る(trim()で前後の余分な空白を取り除く)
function readForm() {
    const values = {};

    BEAN_FIELD_IDS.forEach(function(id) {
        values[id] = document.getElementById(id).value.trim();
    });

    // Firestoreに保存する項目名に置き換える
    return {
        productName: values['product-name'],
        country: values['country'],
        process: values['process'],
        variety: values['variety'],
        roastLevel: values['roastLevel'],
        aroma: values['aroma'],
        farm: values['farm'],
        shop: values['shop'],
        note: values['memo']
    };
}

function showFormError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
}

function clearFormError() {
    formError.textContent = '';
    formError.style.display = 'none';
}


// ========================================
// 2. イベントリスナー群
// ========================================

// キャンセル：編集中なら詳細ページ、新規登録なら一覧へ戻る
cancelBtn.addEventListener('click', function() {
    if (editingId) {
        goToDetail(editingId);
    } else {
        goToHome();
    }
});

// 保存
saveBtn.addEventListener('click', async function() {
    if (isSaving) return; // 連続クリックで二重に保存されるのを防ぐ

    const beanData = readForm();

    // バリデーション(必須項目の確認)
    if (!beanData.productName || !beanData.country || !beanData.process || !beanData.variety || !beanData.aroma) {
        showFormError('商品名・生産国名・プロセス・品種・風味は必須項目です。');
        return;
    }

    clearFormError();
    isSaving = true;
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        if (editingId) {
            // 編集モード
            // update()は渡した項目だけを書き換えるので、お気に入りや登録日はそのまま残る
            await updateLog(editingId, beanData);
            goToDetail(editingId);
        } else {
            // 新規登録モード
            const newBean = {
                ...beanData,
                createdAt: Date.now(),
                isFavorite: false,
                brewCount: 0,
                avgFlavor: null,
                migratedToBrews: true // 新しい形式で作ったデータなので移行は不要
            };

            const newId = await saveLog(newBean); // Firestoreに保存してIDをもらう
            // 続けて抽出記録を追加しやすいように、登録した豆の詳細ページへ移動する
            goToDetail(newId);
        }
    } catch (error) {
        console.error(error);
        showFormError('保存に失敗しました。通信状況を確認して、もう一度お試しください。');
        isSaving = false;
        saveBtn.disabled = false;
        saveBtn.textContent = '保存';
    }
});


// ========================================
// 3. 初期化処理
// ========================================

initPage(async function() {
    if (!editingId) {
        // 新規登録なので、空のフォームをそのまま表示する
        return;
    }

    editingBean = await loadLog(editingId);

    if (!editingBean) {
        // 削除済みなどでデータが見つからない場合は一覧へ戻す
        alert('対象のデータが見つかりませんでした。一覧へ戻ります。');
        goToHome();
        return;
    }

    formTitle.textContent = 'Edit Coffee Bean';
    document.title = `${getBeanName(editingBean)}の編集 | reCoder`;
    fillForm(editingBean);
});
