// ========================================
// すべてのページで共通して使う処理をまとめたファイル
//
// ・ログイン確認(未ログインならログイン画面へ戻す)
// ・日付や文字列の変換
// ・味わい5項目の扱い
// ・ページ間の移動
//
// 各ページのJS(home.js / detail.js など)より前に読み込む。
// ========================================


// ========================================
// 1. 味わい5項目の定義
// ========================================

// 「データ上のキー名」と「画面に出すラベル」をここで一元管理する。
// 項目を増やしたいときは、この配列とフォームのスライダーを追加すればよい。
const FLAVOR_ITEMS = [
    { key: 'acidity', label: '酸味' },
    { key: 'bitterness', label: '苦味' },
    { key: 'richness', label: 'コク' },
    { key: 'sweetness', label: '甘味' },
    { key: 'aromaStrength', label: '香り' }
];

// スライダーのid一覧(HTMLのidはキー名と揃えている)
const FLAVOR_SLIDER_IDS = FLAVOR_ITEMS.map(item => item.key);


// ========================================
// 2. ページ共通の初期化(ログイン確認)
// ========================================

// ログイン済みかを確認してから、そのページ固有の処理(onReady)を実行する。
// 読み込みが終わるまでは本文を隠しておき、未ログインならログイン画面へ戻す。
function initPage(onReady) {
    const pageContent = document.getElementById('page-content');
    const pageLoading = document.getElementById('page-loading');

    setupLogoutButton();

    // onAuthStateChanged: ログイン状態が決まったとき・変わったときにFirebaseが呼んでくれる
    firebase.auth().onAuthStateChanged(async function(user) {
        if (!user) {
            // location.replace は履歴を残さないので、戻るボタンで見られない画面に戻らない
            window.location.replace('index.html');
            return;
        }

        try {
            await onReady(user);
        } catch (error) {
            console.error(error);
            if (pageLoading) {
                pageLoading.textContent = 'データの読み込みに失敗しました。通信状況を確認して、ページを再読み込みしてください。';
            }
            return;
        }

        if (pageLoading) pageLoading.classList.add('hidden');
        if (pageContent) pageContent.classList.remove('hidden');

        lucide.createIcons(); // アイコンを描画する
    });
}

// ヘッダーのログアウトボタン。押すとFirebaseからログアウトし、
// 上のonAuthStateChangedが働いてログイン画面へ戻る。
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function() {
        firebase.auth().signOut();
    });
}


// ========================================
// 3. ページ間の移動
// ========================================

// URLの「?id=xxx」の部分から値を取り出す
// 例: detail.html?id=abc123 のとき getQueryParam('id') は 'abc123' を返す
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// encodeURIComponent: URLの中で特別な意味を持つ記号(&や?など)を安全な表記に変換する
function goToHome() {
    window.location.href = 'home.html';
}

function goToDetail(beanId) {
    window.location.href = `detail.html?id=${encodeURIComponent(beanId)}`;
}

// 引数なしなら新規登録、豆のIDを渡すと編集画面を開く
function goToBeanForm(beanId) {
    if (beanId) {
        window.location.href = `bean-form.html?id=${encodeURIComponent(beanId)}`;
        return;
    }
    window.location.href = 'bean-form.html';
}

// brewIdを渡すと抽出記録の編集、渡さなければ新規追加になる
function goToBrewForm(beanId, brewId) {
    if (brewId) {
        window.location.href = `brew-form.html?beanId=${encodeURIComponent(beanId)}&brewId=${encodeURIComponent(brewId)}`;
        return;
    }
    window.location.href = `brew-form.html?beanId=${encodeURIComponent(beanId)}`;
}


// ========================================
// 4. 文字列と日付の変換
// ========================================

// 文字列をHTMLに埋め込む前に、記号を安全な表記へ変換する。
// 例えば「<」を「&lt;」に置き換えることで、入力値がHTMLタグとして
// 解釈されてレイアウトが壊れたり、悪意あるコードが動いたりするのを防ぐ。
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// タイムスタンプ(1970年からの経過ミリ秒)を「2026/07/25」の形にする
function logDate(timestamp) {
    if (!timestamp) return '日付なし';

    const target = new Date(timestamp);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0'); // ゼロ埋め(この場合はゼロが最大で二つ)
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// <input type="date"> に入れるための「2026-07-25」形式へ変換する
function toDateInputValue(timestamp) {
    const target = new Date(timestamp || Date.now());
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// <input type="date"> の値をタイムスタンプに戻す
function dateInputToTimestamp(value) {
    if (!value) return Date.now();

    // 時刻を付けずに変換すると世界標準時として扱われて日付がずれるため、0時を明示する
    const timestamp = new Date(`${value}T00:00:00`).getTime();
    return Number.isFinite(timestamp) ? timestamp : Date.now();
}

// 「値が入っているか」を判定する(0は有効な値として扱う)
function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
}

// 入力欄の文字列を数値に変換する。空欄や数値でない場合はnullを返す
function toNumberOrNull(value) {
    const trimmed = String(value === null || value === undefined ? '' : value).trim();
    if (trimmed === '') return null;

    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
}


// ========================================
// 5. 豆と味わいの共通処理
// ========================================

// 豆の表示名を取り出す(古いデータはbeanNameという項目名だったため両方に対応する)
function getBeanName(bean) {
    return bean.productName || bean.beanName || '名称未設定';
}

// 味わいの値を、必ず数値の5項目そろった形に整える
function normalizeFlavor(flavor) {
    const result = {};

    FLAVOR_ITEMS.forEach(function(item) {
        const value = Number(flavor ? flavor[item.key] : NaN);
        // 値が無い、または数値に変換できない場合は中央値の3を入れる
        result[item.key] = Number.isFinite(value) ? value : 3;
    });

    return result;
}

// 抽出記録の一覧から「件数」と「味わいの平均」を計算する
function buildFlavorSummary(brews) {
    if (!brews || brews.length === 0) {
        return { brewCount: 0, avgFlavor: null };
    }

    const total = {};
    FLAVOR_ITEMS.forEach(function(item) {
        total[item.key] = 0;
    });

    brews.forEach(function(brew) {
        const flavor = normalizeFlavor(brew.flavor);
        FLAVOR_ITEMS.forEach(function(item) {
            total[item.key] += flavor[item.key];
        });
    });

    const avgFlavor = {};
    FLAVOR_ITEMS.forEach(function(item) {
        // 小数第1位までに丸める(3.6666... → 3.7)
        avgFlavor[item.key] = Math.round((total[item.key] / brews.length) * 10) / 10;
    });

    return { brewCount: brews.length, avgFlavor: avgFlavor };
}

// 一覧やグラフに表示する味わいを決める
function getBeanFlavor(bean) {
    // 抽出記録から計算した平均値があればそれを使う
    if (bean.avgFlavor) return bean.avgFlavor;
    // 旧形式(豆に直接味わいが入っているデータ)への対応
    if (!bean.migratedToBrews && bean.flavor) return bean.flavor;
    return null;
}

// その豆の抽出記録の件数を返す
function getBrewCount(bean) {
    if (typeof bean.brewCount === 'number') return bean.brewCount;
    // 旧形式のデータは、豆に1回分の抽出情報が入っているものとして1件と数える
    if (!bean.migratedToBrews && (bean.flavor || bean.dripper || bean.recipe)) return 1;
    return 0;
}

// 味わいを棒グラフ風のバーで表す。
// グラフ描画ライブラリを使わずCSSだけで表現するので軽く、一覧に何枚並べても重くならない。
function createFlavorBarsHtml(flavor) {
    if (!flavor) {
        return '<p class="flavor-empty">抽出記録がまだありません</p>';
    }

    const normalized = normalizeFlavor(flavor);
    const rowsHtml = FLAVOR_ITEMS.map(function(item) {
        const value = normalized[item.key];
        const percent = Math.max(0, Math.min(100, (value / 5) * 100));
        return `
            <div class="flavor-bar-row">
                <span class="flavor-bar-label">${item.label}</span>
                <span class="flavor-bar-track">
                    <span class="flavor-bar-fill" style="width: ${percent}%"></span>
                </span>
                <span class="flavor-bar-value">${value.toFixed(1)}</span>
            </div>`;
    }).join('');

    return `<div class="flavor-bars">${rowsHtml}</div>`;
}

// お気に入りボタンの見た目を切り替える
function updateFavoriteButton(button, isFavorite) {
    if (!button) return;

    // classList.toggle(クラス名, true/false)で、付ける・外すを指定できる
    button.classList.toggle('active', isFavorite);

    const label = button.querySelector('span');
    if (label) {
        label.textContent = isFavorite ? 'お気に入り' : 'お気に入りに追加';
    }

    lucide.createIcons();
}


// ========================================
// 6. 豆に持たせる集計値の更新
// ========================================

// 豆のドキュメントに、抽出記録の件数と味わいの平均値を保存しておく。
// こうしておくと、一覧画面で豆ごとに抽出記録を読み込まなくても概要を表示できる。
// (同じ情報をあえて2か所に持たせて表示を速くする手法を「非正規化」と呼ぶ)
async function refreshBeanSummary(bean, brews) {
    const summary = buildFlavorSummary(brews);

    // JSON.stringifyで中身を文字列化して、前回の値と同じかどうかを比べる
    const isSameCount = bean.brewCount === summary.brewCount;
    const isSameFlavor = JSON.stringify(bean.avgFlavor || null) === JSON.stringify(summary.avgFlavor);

    bean.brewCount = summary.brewCount;
    bean.avgFlavor = summary.avgFlavor;

    // 変化がなければ通信しない
    if (isSameCount && isSameFlavor) return;

    await updateLog(bean.id, {
        brewCount: summary.brewCount,
        avgFlavor: summary.avgFlavor
    });
}

// 旧形式(豆と抽出情報が1件にまとまっていたデータ)を抽出記録へ切り出す。
// 元の項目は消さずに残したうえで移行済みの印を付けるので、二重に作られることはない。
async function migrateLegacyBrewIfNeeded(bean) {
    if (bean.migratedToBrews) return;

    const hasLegacyBrew = Boolean(bean.flavor || bean.dripper || bean.recipe);

    if (hasLegacyBrew) {
        await saveBrew(bean.id, {
            brewedAt: bean.createdAt || Date.now(),
            createdAt: Date.now(),
            dripper: bean.dripper || '',
            recipe: bean.recipe || '',
            doseGrams: null,
            waterGrams: null,
            waterTemp: null,
            brewTime: '',
            note: '',
            flavor: normalizeFlavor(bean.flavor),
            isLegacy: true
        });
    }

    await updateLog(bean.id, { migratedToBrews: true });
    bean.migratedToBrews = true;
}
