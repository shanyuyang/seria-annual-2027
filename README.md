# 2027 上海 Seria 年会请柬

活动日期：2026-12-25；溪云杏谷民宿，浙江桐庐。

中文：https://shanyuyang.github.io/seria-annual-2027/
日文：https://shanyuyang.github.io/seria-annual-2027/ja/

## 发布

1. 使用 GitHub 账号 shanyuyang 创建公开仓库 seria-annual-2027，并勾选 Add README。
2. Add file → Upload files，上传此文件夹内的全部内容。index.html 应在仓库根目录，assets 和 ja 保持原文件夹结构。不要直接上传 ZIP。
3. Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save。
4. 等待 GitHub Pages 发布成功，打开上方网址。先在国内手机关闭 VPN 测试访问与报名，再分享二维码。

## 报名后台

名单保存在原 CloudBase 环境，公开网页不提供名单查询。筹备组继续使用原本的“年会回执统计_修复版.cmd”导出名单。
后台已准备允许 https://shanyuyang.github.io 提交。若更换 GitHub 账号，需同步修改后台允许来源；若更换账号或仓库名，需重新生成中日文分享封面的二维码。

## 内容

仓库只包含公开网页、字体、Logo及二维码分享封面，不包含后台程序、凭证、回执名单或备份。


## 本次前端调整（公司人数登记）

- 中文页面只填写「所属公司」和「人数」，公司名称为手动输入。
- 中文页面不再展示姓名、性别、备注，也不展示示例表或字段生成说明。
- 日文页面取消报名表和出席确认入口，底部改为居中感谢文字。
- 中文报名成功后，前端要求后台明确返回实际创建的空白名单行数。
- 名单预期结构：公司列写入提交的公司名称；姓名、性别、编号列留空，后续由筹备组补录。

**上线前必须完成 CloudBase 云函数升级。** 当前 ZIP 不包含云函数源码；新前端向原接口发送 `mode=company_headcount`、`company`、`headcount`、`requestId`。请先按 `BACKEND_API_CONTRACT.md` 更新并测试 CloudBase 接口，否则旧的逐人报名接口无法处理新表单。


## 输入框视觉微调

中文报名表的「所属公司」和「人数」输入框已恢复为底部细横线样式：
- 移除四周矩形边框和填充底色。
- 仅保留底部 1px 细线。
- 聚焦时只改变底部线条颜色，不出现外框。
- 不修改报名字段、提交逻辑或 CloudBase API。
