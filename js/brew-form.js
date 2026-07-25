// ========================================
// 抽出記録の入力画面(brew-form.html)専用の処理
//
// URLで対象の豆と、編集する抽出記録を受け取る。
//   新規追加: brew-form.html?beanId=abc123
//   編集    : brew-form.html?beanId=abc123&brewId=xyz789
// ========================================

const brewFormTitle = document.getElementById('brew-form-title');
const brewFormBeanText = document.getElementById('brew-form-bean');
const brewFormError = document.getElementById('brew-form-error');
const brewSaveBtn = document.getElementById('brew-save');
const brewCancelBtn = document.getElementById('brew-cancel');

// 対象の豆のIDと、編集する抽出記録のID(新規追加のときはnull)
const beanId = getQueryParam('beanId');
const editingBrewId = getQueryParam('brewId');

let currentBean = null;
let editingBrew = null;
let isSaving = false;


// ========================================
// 1. 味わいスライダーの操作
// ========================================

// スライダーを動かしたときに、隣の数字を更新する
function bindFlavorSliders() {
    FLAVOR_SLIDER_IDS.forEach(function(id) {
        const slider = document.getElementById(id);
        const valueText = document.getElementById(`${id}-value`);
        if (!slider || !valueText) return;

        slider.addEventListener('input', function() {
            valueText.textContent = slider.value;
        });
    });
}

// スライダーに値を反映する
function setFlavorSliders(flavor) {
    const normalized = normalizeFlavor(flavor);

    FLAVOR_SLIDER_IDS.forEach(function(id) {
        const slider = document.getElementById(id);
        const valueText = document.getElementById(`${id}-value`);
        if (!slider) return;

        slider.value = normalized[id];
        if (valueText) valueText.textContent = slider.value;
    });
}

// スライダーの値を読み取る(input.valueは文字列なのでNumberで数値に変換する)
function readFlavorSliders() {
    const flavor = {};

    FLAVOR_SLIDER_IDS.forEach(function(id) {
        const slider = document.getElementById(id);
        flavor[id] = slider ? Number(slider.value) : 3;
    });

    return flavor;
}


// ========================================
// 2. フォームの表示と読み取り
// ========================================

// 既存の抽出記録を入力欄へ流し込む
function fillForm(brew) {
    document.getElementById('brew-date').value = toDateInputValue(brew.brewedAt || brew.createdAt);
    document.getElementById('brew-dripper').value = brew.dripper || '';
    document.getElementById('brew-dose').value = hasValue(brew.doseGrams) ? brew.doseGrams : '';
    document.getElementById('brew-water').value = hasValue(brew.waterGrams) ? brew.waterGrams : '';
    document.getElementById('brew-temp').value = hasValue(brew.waterTemp) ? brew.waterTemp : '';
    document.getElementById('brew-time').value = brew.brewTime || '';
    document.getElementById('brew-recipe').value = brew.recipe || '';
    document.getElementById('brew-note').value = brew.note || '';
    setFlavorSliders(brew.flavor);
}

// 入力欄の値をFirestoreに保存する形にまとめる
function readForm() {
    return {
        brewedAt: dateInputToTimestamp(document.getElementById('brew-date').value),
        dripper: document.getElementById('brew-dripper').value.trim(),
        doseGrams: toNumberOrNull(document.getElementById('brew-dose').value),
        waterGrams: toNumberOrNull(document.getElementById('brew-water').value),
        waterTemp: toNumberOrNull(document.getElementById('brew-temp').value),
        brewTime: document.getElementById('brew-time').value.trim(),
        recipe: document.getElementById('brew-recipe').value.trim(),
        note: document.getElementById('brew-note').value.trim(),
        flavor: readFlavorSliders()
    };
}

function showFormError(message) {
    brewFormError.textContent = message;
    brewFormError.style.display = 'block';
}


// ========================================
// 3. イベントリスナー群
// ========================================

brewCancelBtn.addEventListener('click', function() {
    goToDetail(beanId);
});

brewSaveBtn.addEventListener('click', async function() {
    if (isSaving) return;

    const brewData = readForm();

    if (!brewData.dripper) {
        showFormError('ドリッパーは必須項目です。');
        return;
    }

    brewFormError.style.display = 'none';
    isSaving = true;
    brewSaveBtn.disabled = true;
    brewSaveBtn.textContent = '保存中...';

    try {
        if (editingBrewId) {
            await updateBrew(beanId, editingBrewId, brewData);
        } else {
            await saveBrew(beanId, { ...brewData, createdAt: Date.now() });
        }

        // 一覧画面で使う集計値(件数・味わいの平均)を、保存後の内容で作り直す
        const brews = await loadBrews(beanId);
        await refreshBeanSummary(currentBean, brews);

        goToDetail(beanId);
    } catch (error) {
        console.error(error);
        showFormError('保存に失敗しました。通信状況を確認して、もう一度お試しください。');
        isSaving = false;
        brewSaveBtn.disabled = false;
        brewSaveBtn.textContent = '保存';
    }
});


// ========================================
// 4. 初期化処理
// ========================================

initPage(async function() {
    if (!beanId) {
        // どの豆の記録か分からないので一覧へ戻す
        goToHome();
        return;
    }

    currentBean = await loadLog(beanId);

    if (!currentBean) {
        alert('対象のコーヒー豆が見つかりませんでした。一覧へ戻ります。');
        goToHome();
        return;
    }

    bindFlavorSliders();
    brewFormBeanText.textContent = `${getBeanName(currentBean)} の抽出記録`;

    if (!editingBrewId) {
        // 新規追加なので、日付だけ今日を初期値にする
        document.getElementById('brew-date').value = toDateInputValue(Date.now());
        return;
    }

    editingBrew = await loadBrew(beanId, editingBrewId);

    if (!editingBrew) {
        alert('対象の抽出記録が見つかりませんでした。詳細ページへ戻ります。');
        goToDetail(beanId);
        return;
    }

    brewFormTitle.textContent = 'Edit Brew';
    fillForm(editingBrew);
});
