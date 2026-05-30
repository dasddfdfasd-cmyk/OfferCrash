# OfferCrash 协作口令

当用户在本仓库中说下面这些话时，按对应流程执行。

## 口令：上传新增文件

触发表达包括：

- `上传新增文件`
- `提交我的修改`
- `我写好了，上传`
- `把我新增的文件传上去`
- `同步到 GitHub`

默认流程：

1. 确认当前在 `frontend` 分支：`git status --short --branch`。
2. 查看待提交文件：`git status --short`。
3. 不提交被 `.gitignore` 忽略的文件，例如 `node_modules/`、`dist/`、`.env`、日志。
4. 如果有代码改动，先执行 `npm run build`。
5. `git add .`
6. 使用用户给出的提交说明；如果用户没有给，使用简洁中文或英文 commit message。
7. `git commit -m "<message>"`
8. `git push origin frontend`
9. 告诉用户：提交 hash、push 是否成功、已有 PR 会自动更新。

安全规则：

- 如果发现明显不相关的大量文件，先暂停并询问用户是否一起提交。
- 如果 build 失败，不提交，先修复或向用户说明阻塞点。
- 不运行 `git reset --hard`、`git checkout -- <file>` 等会丢失用户修改的命令。

## 口令：同步别人上传的文件

触发表达包括：

- `同步别人上传的文件`
- `拉取最新`
- `更新到最新代码`
- `同步远程`
- `pull 一下`

默认流程：

1. 执行 `git status --short --branch`。
2. 如果工作区干净，执行：`git pull --ff-only origin frontend`。
3. 如果 `package.json` 或 `package-lock.json` 有远程变化，执行 `npm install`。
4. 执行 `npm run build` 验证。
5. 告诉用户：拉取结果、是否有新提交、build 是否通过。

安全规则：

- 如果本地有未提交修改，不自动覆盖、不自动 stash，先提示用户选择：先上传、先暂存，或取消同步。
- 如果 `git pull --ff-only` 失败，说明远程与本地有分叉，需要人工处理或创建新提交后再同步。

## 当前协作约定

- 主开发分支：`frontend`
- PR 目标分支：`main`
- 远程仓库：`origin`
- 已打开 PR 后，继续 push 到 `frontend` 会自动更新同一个 PR。
