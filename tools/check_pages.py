# ページごとの静的チェック用スクリプト(開発時の確認用。アプリの動作には使わない)
#
# 1. 各HTMLが読み込むJSを調べ、そのページで使うidがHTMLに存在するかを確認する
# 2. 同じページに読み込まれるJS同士で、トップレベルの変数名がぶつかっていないかを確認する
# 3. JSの括弧の対応が取れているかを確認する
#
# 実行: python tools/check_pages.py

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# チェック対象のHTML(静的な説明ページはアプリのJSを読み込まないため除く)
HTML_FILES = ['index.html', 'home.html', 'bean-form.html', 'detail.html', 'brew-form.html']

# JSに書かれていても、HTMLのidではなく動的に作る要素のid接尾辞など
IGNORE_IDS = set()

errors = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def local_scripts(html):
    """HTMLが読み込むローカルのJSファイル一覧(読み込み順)を返す"""
    return re.findall(r'<script src="(js/[^"?]+)', html)


def html_ids(html):
    return set(re.findall(r'id\s*=\s*"([^"]+)"', html))


def js_ids(js):
    """getElementById('x') で参照しているidを集める(テンプレート文字列は除く)"""
    return set(re.findall(r"getElementById\(\s*'([^'$]+)'\s*\)", js))


def top_level_names(js):
    """行頭(インデントなし)の const / let / function 宣言名を集める"""
    names = []
    for line in js.splitlines():
        m = re.match(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=', line)
        if m:
            names.append(m.group(1))
            continue
        m = re.match(r'(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(', line)
        if m:
            names.append(m.group(1))
    return names


def check_balance(path, js):
    """文字列やコメントを除いたうえで括弧の対応を数える"""
    pairs = {')': '(', ']': '[', '}': '{'}
    # 正規表現リテラル(/.../)の直前に来やすい文字。この後の / は割り算ではなく正規表現とみなす
    regex_prev = set('(,=:[!&|?{};')
    stack = []
    prev_char = ''
    i = 0
    n = len(js)
    while i < n:
        c = js[i]
        if c == '/' and i + 1 < n and js[i + 1] == '/':
            i = js.find('\n', i)
            if i == -1:
                break
            continue
        if c == '/' and i + 1 < n and js[i + 1] == '*':
            i = js.find('*/', i)
            if i == -1:
                break
            i += 2
            continue
        # 正規表現リテラル。/"/g のように中に引用符が入ることがあるのでまとめて飛ばす
        if c == '/' and prev_char in regex_prev:
            i += 1
            while i < n and js[i] != '\n':
                if js[i] == '\\':
                    i += 2
                    continue
                if js[i] == '/':
                    break
                i += 1
            i += 1
            prev_char = 'g'
            continue
        if c in '"\'`':
            quote = c
            i += 1
            while i < n:
                if js[i] == '\\':
                    i += 2
                    continue
                if js[i] == quote:
                    break
                # テンプレート文字列の ${ } の中身も括弧の対象になるが、
                # 数え方を単純にするためここでは文字列としてまとめて飛ばす
                i += 1
            i += 1
            prev_char = quote
            continue
        if c in '([{':
            stack.append(c)
        elif c in ')]}':
            if not stack or stack[-1] != pairs[c]:
                errors.append(f'{path}: 括弧の対応が取れていません(位置 {i})')
                return
            stack.pop()
        if not c.isspace():
            prev_char = c
        i += 1
    if stack:
        errors.append(f'{path}: 閉じられていない括弧があります {stack}')


# --- 1ページずつ確認する ---
for html_file in HTML_FILES:
    html = read(html_file)
    ids = html_ids(html)
    scripts = local_scripts(html)

    seen_names = {}
    for script in scripts:
        js = read(script)

        for used_id in sorted(js_ids(js)):
            if used_id in IGNORE_IDS:
                continue
            if used_id not in ids:
                errors.append(f'{html_file}: {script} が参照する id="{used_id}" がHTMLにありません')

        for name in top_level_names(js):
            if name in seen_names and seen_names[name] != script:
                errors.append(
                    f'{html_file}: 変数/関数 "{name}" が {seen_names[name]} と {script} で重複しています'
                )
            seen_names[name] = script

    print(f'{html_file}: 読み込むJS = {scripts}')

# --- JSファイル単体の括弧チェック ---
for js_path in sorted((ROOT / 'js').glob('*.js')):
    check_balance(f'js/{js_path.name}', js_path.read_text(encoding='utf-8'))

print()
if errors:
    for e in errors:
        print('NG:', e)
    sys.exit(1)

print('OK: 問題は見つかりませんでした')
