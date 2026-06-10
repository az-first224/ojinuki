# おじぬき

J・K・ジョーカーを使った、1対1の推理カードゲームです。

- CPU対戦と2人対戦
- 攻守交代制
- ジョーカーの追加ドロー
- J隠し成功ボーナス
- スマートフォン対応
- HTML/CSS/JavaScriptのみで動作

## ローカルで遊ぶ

`index.html`をブラウザで開いてください。ビルドや依存関係のインストールは不要です。

## GitHub Pagesで公開

1. GitHubで新しいリポジトリを作成します。
2. このフォルダをリポジトリへpushします。
3. GitHubのリポジトリで `Settings` → `Pages` を開きます。
4. `Build and deployment` のSourceを `GitHub Actions` に設定します。
5. `main`ブランチへのpush後、Actionsがサイトを公開します。

公開URLは通常、次の形式です。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

## Vercelで公開

1. [Vercel](https://vercel.com/)で `Add New Project` を選びます。
2. GitHub上のこのリポジトリをImportします。
3. Framework Presetは `Other`、Root Directoryは既定値のままにします。
4. Build CommandとOutput Directoryは空欄のままDeployします。

`vercel.json`が静的サイト用の配信設定を適用します。

## ファイル構成

```text
.
├── .github/workflows/pages.yml
├── .gitignore
├── index.html
├── style.css
├── app.js
├── vercel.json
└── README.md
```
