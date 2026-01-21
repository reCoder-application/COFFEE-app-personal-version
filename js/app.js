const saveBtn = document.getElementById('btn-save');
const cardArea = document.getElementById('card-area');

const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('btn-cancel');
const editBtn = document.getElementById('edit-btn');

const homePage = document.getElementById('home-page');
const addPage = document.getElementById('add-page');
// コーヒーの記録を保存するためのリスト
let coffeeLogs = [];
// 編集中のデータを管理するための変数
let editingId = null;

// 追加ボタンを押した時に、入力画面へ遷移する
addBtn.addEventListener('click', function() {
    homePage.classList.add('hidden');
    addPage.classList.remove('hidden');

})

//　入力のキャンセルボタンを押したら、ホーム画面に遷移する
cancelBtn.addEventListener('click', function() {
    addPage.classList.add('hidden');
    homePage.classList.remove('hidden');
})


const slidersIds = ['acidity', 'bitterness', 'richness', 'sweetness', 'aromaStrength'];

// スライダーの値をリアルタイムで変更し、画面表示する処理
slidersIds.forEach(function(id) {
    const slider = document.getElementById(id);
    const spanId = id + '-value'; // acidityが取り出されたら、acidity-valueとなる
    const valueSpan = document.getElementById(spanId); // acidity-valueが取り出されたら、acidity-valueの要素を取得
    slider.addEventListener('input', function() {
        valueSpan.textContent = slider.value;
    })
})
/* saveBtnにイベントを設定 */
saveBtn.addEventListener('click', function() {

    //  HTMLから値を取得する
    // valueプロパティは現在の値を示すためのもの
    const productName = document.getElementById('product-name').value;
    const country = document.getElementById('country').value;
    const farm = document.getElementById('farm').value;
    const variety = document.getElementById('variety').value;
    const aroma = document.getElementById('aroma').value;
    const process = document.getElementById('process').value;
    const dripper = document.getElementById('dripper').value;
    const shop = document.getElementById('shop').value;
    
    // スライダーの値を取得
    const acidity = document.getElementById('acidity').value;
    const bitterness = document.getElementById('bitterness').value;
    const richness = document.getElementById('richness').value;
    const sweetness = document.getElementById('sweetness').value;
    const aromaStrength = document.getElementById('aromaStrength').value;

    if (!productName || !country || !farm || !variety || !aroma) {
        alert("入力が不完全です。必須項目を入力してください。");
        return;
    }

    // 1件分の記録データ
    const log = {
        id: Date.now(), // 入力時刻でその記録のIDを管理する
        productName: productName,  // 商品名（パッケージに書かれている名前）
        country: country,
        farm: farm,
        variety: variety,
        aroma: aroma,
        process: process,
        dripper: dripper,
        shop: shop,
        likes: 0,  // いいねが押された回数

        flavor: {
            acidity: acidity,
            bitterness: bitterness,
            richness: richness, // コク
            sweetness: sweetness,
            aromaStrength: aromaStrength
        }
    };

    // pushで配列にデータを追加
    if(editingId){
        const index = coffeeLogs.findIndex(log => log.id === editingId); // editingIdと一致するIDを持つlogを探して、そのindexを取得
        log.id = editingId; // 既存のIDを使う
        log.likes = coffeeLogs[index].likes; // いいね数を保持する
        coffeeLogs[index] = log; // 編集した内容のlogで更新する

        const oldCard = document.querySelector(`[data-id="${editingId}"]`).closest('.glass-card');
        // カスタムデータ属性である"data-id"で編集対象のカードを特定し、
        if(oldCard){
            oldCard.remove();
        }

        editingId = null;
        
    } else {
    coffeeLogs.push(log);
    }
    // ブラウザにデータを保存(localStrage: ブラウザに備わっている簡易的なデータベース)
    // localStrageは「文字」しか保存できないため
    // JSON.stringifyでオブジェクトを文字列に変換してから保存している
    localStorage.setItem('coffeeLogs', JSON.stringify(coffeeLogs));
    renderCard(log);

    /* valueプロパティは現在の値を示すため、ここでidがproduct-nameの要素を空白にすることで
       カードを追加した後は入力欄が空白になる*/
    document.getElementById('product-name').value = "";
    document.getElementById('country').value = "";
    document.getElementById('farm').value = "";
    document.getElementById('variety').value = "";
    document.getElementById('aroma').value = "";
    document.getElementById('process').value = "";
    document.getElementById('dripper').value = "";
    document.getElementById('shop').value = "";

    addPage.classList.add('hidden');
    homePage.classList.remove('hidden');

}, false);

function renderCard(log) {
    /* htmlのカードを作る */

    if (!log.flavor) {
        console.warn('古いデータ形式のため、スキップします:', log);
        return;
    }

    // 既存データとの互換性のため、beanNameがあればproductNameとして扱う
    const displayName = log.productName || log.beanName || '名称未設定';

    const cardHtml = /*html*/`
        <div class="glass-card">
            <div class="card-header">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${displayName}</h3>
                        <button class="action-btn edit-btn" data-id="${log.id}">
                            <i data-lucide="edit"></i>
                        </button>
                    </div>

                    <div class="meta-info">
                        <span><i data-lucide="map-pin"></i> ${log.country}</span>
                        <span>/</span>
                        <span><i data-lucide="tree-deciduous"></i>${log.farm}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="sprout"></i> ${log.variety}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="droplets"></i> ${log.process || '未記録'}</span>
                        <span>/</span>
                        <span><i data-lucide="filter"></i> ${log.dripper || '未登録'}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="shopping-bag"></i> ${log.shop || '未登録'}</span>
                    </div>
                </div>
            </div>

            <p class="notes">"${log.aroma}"</p>
            <div class = "chart-container">
                <canvas id = "chart-${log.id}"></canvas>
            </div>

            <div class="card-footer">
                <button class="action-btn like-btn" data-id = "${log.id}"><i data-lucide="thumbs-up"></i>
                    <span class = "like-count">0</span></button>
                <button class="action-btn delete-btn" data-id = "${log.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `;

    // 画面に追加する
    // list(card-area)の一番上に新しいカードを追加する
    cardArea.insertAdjacentHTML('afterbegin', cardHtml);

    // レーダーチャートを作成
    const ctx = document.getElementById(`chart-${log.id}`).getContext('2d');
    new Chart(ctx, {
        type: 'radar', // レーダーチャート
        data: {
            labels: ['Acidity', 'Bitterness', 'Body', 'Sweetness', 'Aroma'], // 各軸のラベル
            datasets: [
                    {
                    label: 'Flavor Profile', // 凡例に表示される名前
                    data: [log.flavor.acidity,
                        log.flavor.bitterness,
                        log.flavor.richness,
                        log.flavor.sweetness,
                        log.flavor.aromaStrength],
                        backgroundColor: 'rgba(212, 175, 55, 0.2)',
                        borderColor: 'rgba(212, 175, 55, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#d4af37' // 点の色
                    }
                ],
            },
        options: {
            responsive: true, // 親要素に合わせてサイズを自動調整する
            maintainAspectRatio: false, // サイズ変更の際に、元のキャンバスのアスペクト比(width/height)を維持する
            scales: {
                r: { // r:レーダーチャート専用の軸設定
                    min: 0,
                    max: 5,
                    ticks: { // 軸の目盛り（数値や文字）の表示形式や範囲を細かくカスタマイズする
                        stepSize: 1,
                        color: '#a0a0a0',
                        backdropColor: 'transparent',
                        display: false

                    },
                    grid: { // グラフ背景の軸線やメモリ線の表示・色・太さ・間隔をカスタム
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'  // 放射線の色
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // 凡例を非表示
                }
            }
        }
    })

    lucide.createIcons();
}


// 親エリア(list)にクリックイベントを仕掛ける
cardArea.addEventListener('click', function(e) {

    // クリックされたものが削除ボタンか、いいねボタンかを確認する
    // 対象のHTMLタグのオブジェクトが渡される
    const deletBtn = e.target.closest('.delete-btn');
    const likeBtn  = e.target.closest('.like-btn');
    const editBtn  = e.target.closest('.edit-btn');

    if (deletBtn){
        const result = window.confirm("本当に削除しますか？");
        if(result === true) {

            // ボタンに埋め込んだIDを読み取る
            // dataset.idは文字としてとれるから、Number()で数値に変換する
            const deletId = Number(deletBtn.dataset.id);

            // 配列(coffeeLogs)から対称のIDを読み取る
            // filter: 条件に合うものだけ残して、新しい配列を作る命令
            // filterメソッド: 条件にあうものだけ(ここではdeletIdとidが一致しない要素)を残して、新しい配列を作る
            // IDが一致しない(消さない)やつだけ残すという書き方をする
            // 結果、消したい要素だけが消えた新しいリストで、元の変数を上書きする
            coffeeLogs = coffeeLogs.filter(log => log.id != deletId);

            // 最新の状態になった配列を保存し直す(上書きする)
            localStorage.setItem('coffeeLogs', JSON.stringify(coffeeLogs));

            // そのとき特定のカードの削除ボタンのidを持つdeletBtnから見て、親要素であるカード.glass-cardを探す
            const card = deletBtn.closest('.glass-card');
            console.log(card);
            if(card) {
                card.remove();
            }
        }
    }

    // いいねの処理
    else if(likeBtn) { // likeボタンが押された場合
        const countSpan = likeBtn.querySelector('.like-count');

        // countSpan変数のテキストコンテントを指定することで、今の数字を取得して、数値に変換
        let count = parseInt(countSpan.textContent);

        // まだ「いいね」してないか判定 (activeクラスを持ってるか？)
        // likeBtn変数が持つクラスのリストに'active'というクラスが入っているかどうかを確認
        // likeBtn.classList: action-btn like-btn
        if (!likeBtn.classList.contains('active')) {
            // まだいいねしていない場合:"active"クラスを追加して、CSSスタイルを適用できるようにする
            likeBtn.classList.add('active');
            count ++;
        }
        else {
            likeBtn.classList.remove('active');
            count --;
        }

        countSpan.textContent = count;

        // likeBtn(押されたボタン)kからIDを取り出して、数値に変換する
        const likeId = Number(likeBtn.dataset.id);
        // targetLog: いいねしたいIDを持つデータのオブジェクトが代入される
        /*「logのid(log.id)」と「今取得したlikeId」が等しいデータを1つ見つけてほしい。
        　　見つけたら、targetLogという変数に入れる*/
        const targetLog = coffeeLogs.find(log => log.id === likeId);

        if(targetLog) {
            targetLog.likes = count;
        }

        localStorage.setItem('coffeeLogs', JSON.stringify(coffeeLogs));

        console.log('保存完了！ ID:' + likeId + ' のいいね数:' + count);
    }

    else if(editBtn){
    // ここに編集ボタンが押されたときの処理を書く
    // ヒント: editBtn.dataset.id でIDを取得できます
    // ヒント: editCard()という関数を呼び出す

        // 編集したいデータのidを取得
        const targetId = Number(editBtn.dataset.id);

        // 配列から指定したidのデータを見つけて、取り出す
        const targetLog = coffeeLogs.find(log => log.id === targetId);
        if(!targetLog){
            return;
        }

        // フォームにデータを設定
        document.getElementById('product-name').value = targetLog.productName;
        document.getElementById('country').value = targetLog.country;
        document.getElementById('farm').value = targetLog.farm;
        document.getElementById('variety').value = targetLog.variety;
        document.getElementById('aroma').value = targetLog.aroma;
        document.getElementById('process').value = targetLog.process;
        document.getElementById('dripper').value = targetLog.dripper;
        document.getElementById('shop').value = targetLog.shop;

        // スライダーの値と表示を設定
        document.getElementById('acidity').value = targetLog.flavor.acidity;
        document.getElementById('bitterness').value = targetLog.flavor.bitterness;
        document.getElementById('richness').value = targetLog.flavor.richness;
        document.getElementById('sweetness').value = targetLog.flavor.sweetness;
        document.getElementById('aromaStrength').value = targetLog.flavor.aromaStrength;

        // スライダーの数値の表示
        document.getElementById('acidity-value').textContent = targetLog.flavor.acidity;
        document.getElementById('bitterness-value').textContent = targetLog.flavor.bitterness;
        document.getElementById('richness-value').textContent = targetLog.flavor.richness;
        document.getElementById('sweetness-value').textContent = targetLog.flavor.sweetness;
        document.getElementById('aromaStrength-value').textContent = targetLog.flavor.aromaStrength;

        editingId = targetId; // 今現在、編集中なのか、新規追加のデータを入力中なのかを判定する変数

        homePage.classList.add('hidden');
        addPage.classList.remove('hidden');
    }
})

const savedLogs = localStorage.getItem('coffeeLogs');

if (savedLogs) {
    // 文字(JSON)を配列のリストに戻す
    coffeeLogs = JSON.parse(savedLogs);

    // リストから要素を一つづつ取り出して、カードを表示する。
    // 後で入力する項目が増える可能性がある空、forEachを使う
    coffeeLogs.forEach(function(log) {
        renderCard(log);
    });
}