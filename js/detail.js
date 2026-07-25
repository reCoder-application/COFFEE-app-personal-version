// ========================================
// 詳細ページ(detail.html)専用の処理
//
// URLの ?id=豆のID で表示する豆を受け取る。
//   例: detail.html?id=abc123
//
// ・豆の基本情報とメモを表示する
// ・抽出記録の平均値から味わいのグラフを描く
// ・その豆に紐づく抽出記録の一覧を表示する
// ========================================

const detailName = document.getElementById('detail-name');
const detailMeta = document.getElementById('detail-meta');
const detailNote = document.getElementById('detail-note');
const detailChartArea = document.getElementById('detail-chart-area');
const detailChartEmpty = document.getElementById('detail-chart-empty');
const detailFavoriteBtn = document.getElementById('detail-favorite');
const detailEditBtn = document.getElementById('detail-edit');
const detailDeleteBtn = document.getElementById('detail-delete');

const brewListArea = document.getElementById('brew-list');
const brewCountBadge = document.getElementById('brew-count');
const addBrewBtn = document.getElementById('add-brew-btn');

// 表示する豆のID
const beanId = getQueryParam('id');

// 表示中の豆と、その抽出記録
let currentBean = null;
let currentBrews = [];

// Chart.jsのグラフ本体。描き直す前に前のグラフを消すために保持しておく
let detailChart = null;


// ========================================
// 1. 豆の基本情報の表示
// ========================================

// 「項目名: 値」の1行を作る。値が空の項目は表示しない
function createMetaRowHtml(iconName, label, value) {
    if (!hasValue(value)) return '';

    return `
        <div class="detail-meta-row">
            <span class="detail-meta-label"><i data-lucide="${iconName}"></i> ${label}</span>
            <span class="detail-meta-value">${escapeHtml(value)}</span>
        </div>`;
}

function renderBeanInfo() {
    detailName.textContent = getBeanName(currentBean);
    document.title = `${getBeanName(currentBean)} | reCoder`;

    detailMeta.innerHTML = [
        createMetaRowHtml('calendar', '登録日', logDate(currentBean.createdAt)),
        createMetaRowHtml('map-pin', '生産国', currentBean.country),
        createMetaRowHtml('tree-deciduous', '農園', currentBean.farm),
        createMetaRowHtml('sprout', '品種', currentBean.variety),
        createMetaRowHtml('droplets', 'プロセス', currentBean.process),
        createMetaRowHtml('flame', '焙煎度', currentBean.roastLevel),
        createMetaRowHtml('sparkles', '風味', currentBean.aroma),
        createMetaRowHtml('shopping-bag', '購入店', currentBean.shop)
    ].join('');

    if (hasValue(currentBean.note)) {
        detailNote.textContent = currentBean.note;
        detailNote.classList.remove('hidden');
    } else {
        detailNote.classList.add('hidden');
    }

    updateFavoriteButton(detailFavoriteBtn, Boolean(currentBean.isFavorite));
}


// ========================================
// 2. 味わいのグラフ
// ========================================

// 抽出記録の平均値をレーダーチャートで描く
function renderChart() {
    const flavor = getBeanFlavor(currentBean);

    // 記録がなければグラフを消して案内文に切り替える
    if (!flavor) {
        if (detailChart) {
            detailChart.destroy(); // 古いグラフを破棄しないと残ってしまう
            detailChart = null;
        }
        detailChartArea.classList.add('hidden');
        detailChartEmpty.classList.remove('hidden');
        return;
    }

    detailChartArea.classList.remove('hidden');
    detailChartEmpty.classList.add('hidden');

    const normalized = normalizeFlavor(flavor);
    const labels = FLAVOR_ITEMS.map(item => item.label);
    const values = FLAVOR_ITEMS.map(item => normalized[item.key]);

    if (detailChart) {
        detailChart.destroy();
    }

    const ctx = document.getElementById('detail-chart').getContext('2d');
    detailChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '味わい',
                data: values,
                backgroundColor: 'rgba(139, 94, 60, 0.25)',
                borderColor: 'rgba(139, 94, 60, 0.9)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(139, 94, 60, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ========================================
// 3. 抽出記録の一覧
// ========================================

// 抽出条件(豆の量・湯量・湯温・時間)を1行にまとめる
function createBrewRecipeText(brew) {
    const parts = [];

    if (hasValue(brew.doseGrams)) parts.push(`豆 ${brew.doseGrams}g`);
    if (hasValue(brew.waterGrams)) parts.push(`湯 ${brew.waterGrams}g`);
    if (hasValue(brew.waterTemp)) parts.push(`${brew.waterTemp}℃`);
    if (hasValue(brew.brewTime)) parts.push(String(brew.brewTime));

    return parts.join(' / ');
}

// 抽出記録1件分のHTMLを作る
function createBrewCardHtml(brew) {
    const recipeText = createBrewRecipeText(brew);

    return `
        <article class="brew-card" data-brew-id="${escapeHtml(brew.id)}">
            <div class="brew-card-header">
                <span class="brew-date"><i data-lucide="calendar"></i> ${logDate(brew.brewedAt || brew.createdAt)}</span>
                ${brew.isLegacy ? '<span class="brew-legacy-badge">旧データから移行</span>' : ''}
            </div>

            <div class="meta-info brew-specs">
                ${brew.dripper ? `<span><i data-lucide="filter"></i> ${escapeHtml(brew.dripper)}</span>` : ''}
                ${recipeText ? `<span><i data-lucide="scale"></i> ${escapeHtml(recipeText)}</span>` : ''}
            </div>

            ${brew.recipe ? `<p class="brew-text"><i data-lucide="list-ordered"></i>${escapeHtml(brew.recipe)}</p>` : ''}
            ${brew.note ? `<p class="brew-text"><i data-lucide="pencil"></i>${escapeHtml(brew.note)}</p>` : ''}

            ${createFlavorBarsHtml(brew.flavor)}

            <div class="brew-card-footer">
                <button type="button" class="action-btn brew-edit-btn">
                    <i data-lucide="edit"></i>
                    <span>編集</span>
                </button>
                <button type="button" class="action-btn delete-btn brew-delete-btn">
                    <i data-lucide="trash-2"></i>
                    <span>削除</span>
                </button>
            </div>
        </article>`;
}

function renderBrewList() {
    brewCountBadge.textContent = `${currentBrews.length}件`;

    if (currentBrews.length === 0) {
        brewListArea.innerHTML = '<p class="empty-message">まだ抽出記録がありません。「抽出記録を追加」から、淹れ方と味わいを記録してみましょう。</p>';
        return;
    }

    brewListArea.innerHTML = currentBrews.map(function(brew) {
        return createBrewCardHtml(brew);
    }).join('');
}


// ========================================
// 4. イベントリスナー群
// ========================================

// お気に入りの切り替え
detailFavoriteBtn.addEventListener('click', async function() {
    currentBean.isFavorite = !currentBean.isFavorite;
    updateFavoriteButton(detailFavoriteBtn, currentBean.isFavorite);
    await toggleFavorite(currentBean.id, currentBean.isFavorite);
});

// 豆情報の編集画面へ移動
detailEditBtn.addEventListener('click', function() {
    goToBeanForm(currentBean.id);
});

// 豆の削除(抽出記録もまとめて消えるため、確認モーダルを出す)
detailDeleteBtn.addEventListener('click', function() {
    openModal(
        '削除の確認',
        `「${getBeanName(currentBean)}」と、紐づく抽出記録${currentBrews.length}件をすべて削除します。この操作は取り消せません。`,
        async function() {
            await deleteLog(currentBean.id);
            goToHome();
        }
    );
});

// 抽出記録の追加画面へ移動
addBrewBtn.addEventListener('click', function() {
    goToBrewForm(currentBean.id);
});

// 抽出記録の編集・削除(イベント委譲でまとめて受け取る)
brewListArea.addEventListener('click', async function(e) {
    const card = e.target.closest('.brew-card');
    if (!card) return;

    const brewId = card.dataset.brewId;

    if (e.target.closest('.brew-edit-btn')) {
        goToBrewForm(currentBean.id, brewId);
        return;
    }

    if (e.target.closest('.brew-delete-btn')) {
        openModal('削除の確認', 'この抽出記録を削除します。この操作は取り消せません。', async function() {
            await deleteBrew(currentBean.id, brewId);

            // 画面上のデータからも取り除いて、豆側の集計値を更新する
            currentBrews = currentBrews.filter(brew => brew.id !== brewId);
            await refreshBeanSummary(currentBean, currentBrews);

            renderBrewList();
            renderChart();
            lucide.createIcons();
        });
    }
});


// ========================================
// 5. 初期化処理
// ========================================

initPage(async function() {
    if (!beanId) {
        // IDがないと何を表示すべきか分からないので一覧へ戻す
        goToHome();
        return;
    }

    currentBean = await loadLog(beanId);

    if (!currentBean) {
        alert('対象のデータが見つかりませんでした。一覧へ戻ります。');
        goToHome();
        return;
    }

    // 旧形式のデータを開いたときは、抽出記録として切り出してから表示する
    await migrateLegacyBrewIfNeeded(currentBean);

    currentBrews = await loadBrews(beanId);

    // 一覧画面で使う集計値(件数・味わいの平均)を最新に保つ
    await refreshBeanSummary(currentBean, currentBrews);

    renderBeanInfo();
    renderBrewList();
    renderChart();
});
