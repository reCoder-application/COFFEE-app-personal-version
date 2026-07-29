// ========================================
// 一覧画面(home.html)専用の処理
//
// ・登録済みのコーヒー豆を一覧表示する
// ・検索・絞り込み・並び替えを行う
// ・カードを押すと詳細ページへ移動する
// ========================================

const cardArea = document.getElementById('card-area');
const addBtn = document.getElementById('add-btn');

// 検索・絞り込み・並び替えのための要素
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear');
const filterRoastSelect = document.getElementById('filter-roast');
const filterProcessSelect = document.getElementById('filter-process');
const filterFavoriteCheck = document.getElementById('filter-favorite');
const sortSelect = document.getElementById('sort-select');
const resultCountText = document.getElementById('result-count');

// 読み込んだコーヒー豆のデータ
let coffeeLogs = [];

// 絞り込み条件の保存に使うキー名
const FILTER_STORAGE_KEY = 'recoder-home-filter';

// 検索・絞り込み・並び替えの初期状態
const DEFAULT_FILTER_STATE = {
    keyword: '',        // 検索語
    roastLevel: '',     // 焙煎度の絞り込み('' はすべて)
    process: '',        // 精製方法の絞り込み
    favoriteOnly: false,// お気に入りだけ表示するか
    sort: 'newest'      // 並び替えの種類
};

let filterState = { ...DEFAULT_FILTER_STATE };


// ========================================
// 1. 絞り込み条件の保存と復元
// ========================================

// 詳細ページへ移動して戻ってきたときに検索条件が消えないよう、sessionStorageに覚えておく。
// sessionStorage: 開いているタブの中だけで保持されるブラウザの保存領域。タブを閉じると消える。
function saveFilterState() {
    try {
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterState));
    } catch (error) {
        // 保存できなくても表示自体には影響しないため、記録だけ残して続行する
        console.warn('絞り込み条件を保存できませんでした', error);
    }
}

function restoreFilterState() {
    try {
        const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (!saved) return;

        // JSON.parse: 文字列として保存したデータをオブジェクトに戻す
        filterState = { ...DEFAULT_FILTER_STATE, ...JSON.parse(saved) };
    } catch (error) {
        console.warn('絞り込み条件を復元できませんでした', error);
        filterState = { ...DEFAULT_FILTER_STATE };
    }
}

// 保存されている条件を画面の入力欄へ反映する
function applyFilterStateToInputs() {
    searchInput.value = filterState.keyword;
    filterFavoriteCheck.checked = filterState.favoriteOnly;
    sortSelect.value = filterState.sort;
    filterRoastSelect.value = filterState.roastLevel;
    filterProcessSelect.value = filterState.process;
}


// ========================================
// 2. 検索・絞り込み・並び替え
// ========================================

// 検索語が、豆の名前・生産国・農園・品種のどれかに含まれるかを調べる
function matchesKeyword(bean, keyword) {
    if (!keyword) return true;

    const target = [getBeanName(bean), bean.country, bean.farm, bean.variety]
        .filter(Boolean) // 空の項目を除く
        .join(' ')
        .toLowerCase();  // 大文字小文字の違いを無視するため小文字に揃える

    return target.includes(keyword);
}

// 並び替えを行う
function sortBeans(beans, sort) {
    // 元の配列を壊さないためにコピーしてから並び替える
    const sorted = [...beans];

    switch (sort) {
        case 'oldest':
            sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            break;
        case 'name-asc':
            // localeCompare: 文字列を辞書順で比べる。'ja'を渡すと日本語の並びに合う
            sorted.sort((a, b) => getBeanName(a).localeCompare(getBeanName(b), 'ja'));
            break;
        case 'name-desc':
            sorted.sort((a, b) => getBeanName(b).localeCompare(getBeanName(a), 'ja'));
            break;
        case 'brew-desc':
            sorted.sort((a, b) => getBrewCount(b) - getBrewCount(a));
            break;
        default: // newest
            sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return sorted;
}

// 現在の絞り込み条件に合う豆だけを、並び替えた状態で返す
function getVisibleBeans() {
    const keyword = filterState.keyword.trim().toLowerCase();

    const filtered = coffeeLogs.filter(function(bean) {
        if (!matchesKeyword(bean, keyword)) return false;
        if (filterState.roastLevel && (bean.roastLevel || '') !== filterState.roastLevel) return false;
        if (filterState.process && (bean.process || '') !== filterState.process) return false;
        if (filterState.favoriteOnly && !bean.isFavorite) return false;
        return true;
    });

    return sortBeans(filtered, filterState.sort);
}

// 登録済みデータから、指定した項目の値を重複なく取り出す
function collectUniqueValues(key) {
    const values = coffeeLogs
        .map(bean => (bean[key] || '').trim())
        .filter(value => value !== '');

    // Set: 同じ値を1つしか持てない集合。[...new Set(配列)]で重複を除いた配列に戻せる
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ja'));
}

// 絞り込み用のプルダウンの選択肢を作り直し、有効な選択値を返す
function updateSelectOptions(selectEl, values, selectedValue) {
    if (!selectEl) return '';

    const optionsHtml = ['<option value="">すべて</option>']
        .concat(values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
        .join('');
    selectEl.innerHTML = optionsHtml;

    // 選択していた値が候補から消えた場合(その豆を削除したときなど)は絞り込みを解除する
    if (values.includes(selectedValue)) {
        selectEl.value = selectedValue;
        return selectedValue;
    }

    selectEl.value = '';
    return '';
}

// 焙煎度と精製方法の選択肢を、登録済みデータに合わせて作る。
// 選択肢は読み込んだデータだけで決まるので、検索や並び替えのたびに作り直す必要はない。
function refreshFilterOptions() {
    filterState.roastLevel = updateSelectOptions(
        filterRoastSelect,
        collectUniqueValues('roastLevel'),
        filterState.roastLevel
    );
    filterState.process = updateSelectOptions(
        filterProcessSelect,
        collectUniqueValues('process'),
        filterState.process
    );
}


// ========================================
// 3. 一覧の描画
// ========================================

// 一覧に並べるカード1枚分のHTMLを作る。
// 詳しい情報は詳細ページに任せて、ここでは概要だけを見せる。
function createCardHtml(bean) {
    const brewCount = getBrewCount(bean);

    return `
        <article class="glass-card bean-card" data-id="${escapeHtml(bean.id)}">
            <div class="bean-card-body">
                <h3>${escapeHtml(getBeanName(bean))}</h3>

                <div class="meta-info">
                    <span><i data-lucide="calendar"></i> ${logDate(bean.createdAt)}</span>
                    ${bean.shop ? `<span><i data-lucide="shopping-bag"></i> ${escapeHtml(bean.shop)}</span>` : ''}
                </div>

                <div class="meta-info">
                    <span><i data-lucide="map-pin"></i> ${escapeHtml(bean.country || 'N/A')}</span>
                    ${bean.farm ? `<span>/</span><span><i data-lucide="tree-deciduous"></i> ${escapeHtml(bean.farm)}</span>` : ''}
                </div>

                <div class="meta-info">
                    <span><i data-lucide="sprout"></i> ${escapeHtml(bean.variety || 'N/A')}</span>
                    <span>/</span>
                    <span><i data-lucide="droplets"></i> ${escapeHtml(bean.process || 'N/A')}</span>
                    ${bean.roastLevel ? `<span>/</span><span><i data-lucide="flame"></i> ${escapeHtml(bean.roastLevel)}</span>` : ''}
                </div>

                ${createFlavorBarsHtml(getBeanFlavor(bean))}

                <div class="meta-info">
                    <span><i data-lucide="coffee"></i> 抽出記録 ${brewCount}件</span>
                </div>
            </div>

            <div class="card-footer">
                <button type="button" class="action-btn favorite-btn ${bean.isFavorite ? 'active' : ''}">
                    <i data-lucide="star"></i>
                    <span>${bean.isFavorite ? 'お気に入り' : 'お気に入りに追加'}</span>
                </button>

                <button type="button" class="action-btn detail-btn">
                    <span>詳細を見る</span>
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        </article>`;
}

// 絞り込みと並び替えを反映して一覧を描き直す
function renderList() {
    const visibleBeans = getVisibleBeans();

    if (coffeeLogs.length === 0) {
        cardArea.innerHTML = '<p class="empty-message">まだ記録がありません。右下の「＋」ボタンから最初のコーヒー豆を登録してみましょう。</p>';
    } else if (visibleBeans.length === 0) {
        cardArea.innerHTML = '<p class="empty-message">条件に合う記録が見つかりませんでした。検索語や絞り込みを変えてお試しください。</p>';
    } else {
        // 1枚ずつ挿入するより、全カード分のHTMLをまとめて反映したほうが速い
        cardArea.innerHTML = visibleBeans.map(function(bean) {
            return createCardHtml(bean);
        }).join('');
    }

    updateResultCount(visibleBeans.length);
    saveFilterState();
    lucide.createIcons();
}

// 「3件を表示中（全8件）」のような件数表示を更新する
function updateResultCount(visibleCount) {
    if (!resultCountText) return;

    if (coffeeLogs.length === 0) {
        resultCountText.textContent = '';
        return;
    }

    resultCountText.textContent = `${visibleCount}件を表示中（全${coffeeLogs.length}件）`;
}


// ========================================
// 4. イベントリスナー群
// ========================================

// 追加ボタン：豆の登録画面へ移動する
addBtn.addEventListener('click', function() {
    goToBeanForm();
});

// 検索欄：入力するたびに絞り込む(インクリメンタルサーチ)
searchInput.addEventListener('input', function() {
    filterState.keyword = searchInput.value;
    renderList();
});

// 検索条件のリセットボタン
searchClearBtn.addEventListener('click', function() {
    filterState = { ...DEFAULT_FILTER_STATE };
    applyFilterStateToInputs();
    renderList();
});

// 焙煎度の絞り込み
filterRoastSelect.addEventListener('change', function() {
    filterState.roastLevel = filterRoastSelect.value;
    renderList();
});

// 精製方法の絞り込み
filterProcessSelect.addEventListener('change', function() {
    filterState.process = filterProcessSelect.value;
    renderList();
});

// お気に入りだけを表示する切り替え
filterFavoriteCheck.addEventListener('change', function() {
    filterState.favoriteOnly = filterFavoriteCheck.checked;
    renderList();
});

// 並び替え
sortSelect.addEventListener('change', function() {
    filterState.sort = sortSelect.value;
    renderList();
});

// カードエリアのイベント委譲（お気に入りの切り替えと詳細ページへの移動）
cardArea.addEventListener('click', async function(e) {
    // closest: クリックされた要素から親をたどって、条件に合う一番近い要素を探す
    const card = e.target.closest('.bean-card');
    if (!card) return;

    const beanId = card.dataset.id; // dataset.idはhtml要素のdata-id属性の値
    const favoriteBtn = e.target.closest('.favorite-btn');

    if (favoriteBtn) {
        const targetBean = coffeeLogs.find(bean => bean.id === beanId);
        if (!targetBean) return;

        targetBean.isFavorite = !targetBean.isFavorite;
        await toggleFavorite(targetBean.id, targetBean.isFavorite);

        if (filterState.favoriteOnly) {
            // 「お気に入りのみ」表示中は一覧から外れることがあるので描き直す
            renderList();
        } else {
            updateFavoriteButton(favoriteBtn, targetBean.isFavorite);
        }
        return;
    }

    // カード本体か「詳細を見る」ボタンをクリックしたら詳細ページへ
    if (e.target.closest('.bean-card-body') || e.target.closest('.detail-btn')) {
        goToDetail(beanId);
    }
});


// ========================================
// 5. 初期化処理
// ========================================

// ログイン確認が終わってから呼ばれる
initPage(async function() {
    coffeeLogs = await loadLogs(); // Firestoreから読み込む

    restoreFilterState();
    refreshFilterOptions();   // 読み込んだデータから絞り込みの選択肢を作る
    applyFilterStateToInputs();
    renderList();
});
