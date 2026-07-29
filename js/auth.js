// ========================================
// ログイン画面(index.html)専用の処理
//
// ・メールアドレスとパスワードでのログインと新規登録
// ・すでにログインしている場合は一覧画面(home.html)へ移動
// ========================================

const authTitle = document.getElementById('auth-title');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const authError = document.getElementById('auth-error');

// 現在のモード(ログイン ⇔ 新規登録)
let isLoginMode = true;

// 「新規登録」「ログイン」のリンクを押したときに、画面の文言を切り替える
authSwitchLink.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authError.style.display = 'none'; // エラーを消す

    if (isLoginMode) {
        authTitle.textContent = 'Welcome to reCoder.';
        authSubmitBtn.textContent = 'ログイン';
        authSwitchText.textContent = 'アカウントをお持ちでないですか?';
        authSwitchLink.textContent = '新規登録';
    } else {
        authTitle.textContent = 'Create your account.';
        authSubmitBtn.textContent = '登録して始める';
        authSwitchText.textContent = 'すでにアカウントをお持ちですか?';
        authSwitchLink.textContent = 'ログイン';
    }
});

// ログイン / 新規登録ボタンを押したときの処理
authSubmitBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;

    if (!email || !password) {
        showError('メールアドレスとパスワードを入力してください。');
        return;
    }

    try {
        if (isLoginMode) {
            // ログイン処理
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } else {
            // 新規登録処理
            await firebase.auth().createUserWithEmailAndPassword(email, password);
        }

        // 成功したら入力欄を空にする
        // 画面の移動は、下のonAuthStateChangedが行う
        authEmail.value = '';
        authPassword.value = '';
        authError.style.display = 'none';
    } catch (error) {
        console.error(error);
        // firebaseのエラーメッセージを日本語に変換して表示する
        if (error.code === 'auth/invalid-email') showError('メールアドレスが正しくありません。');
        else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') showError('メールアドレスかパスワードが間違っています。');
        else if (error.code === 'auth/invalid-credential') showError('メールアドレスかパスワードが間違っています。');
        else if (error.code === 'auth/email-already-in-use') showError('このメールアドレスは既に登録されています。');
        else if (error.code === 'auth/weak-password') showError('パスワードは6文字以上で入力してください。');
        else showError('エラーが発生しました。もう一度お試しください。');
    }
});

// Enterキーでも送信できるようにする
[authEmail, authPassword].forEach(function(input) {
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            authSubmitBtn.click();
        }
    });
});

// 各種エラーメッセージを表示する関数
function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

// ログイン状態の監視(firebaseが自動で呼び出してくれる)
// ログイン済みなら、このページに留まる必要がないので一覧画面へ移動する
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('ログインしました:', user.email);
        // location.replace は履歴を残さないので、戻るボタンでログイン画面に戻らない
        window.location.replace('home.html');
    }
});
