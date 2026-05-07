# AGENTS.md

## 原则

- 先读当前实现，再改代码；不要只按旧文档或记忆判断。
- 保持改动小而准，围绕当前任务闭环，不做无关重构。
- 不破坏 Android、backend、frontend 之间的数据契约。
- 后端接口、数据结构、业务行为变更必须补测试。
- 前端不是 demo 页面，要按长期使用产品来做：明确层级、状态完整、移动端可用、每页有下一步行动。
- 不覆盖用户已有未提交修改；遇到无关脏改动要保留并说明。
- 不能运行验证命令时，要说明命令和原因。

## 产品边界

- 项目定位是“本地可长期演示和使用的应急车道疑似占用检测工作台”。
- Android 端负责采集、检测、ROI 判断、事件生成和上传。
- HP 电脑端负责本地服务、证据存储、人工复核、设备状态和系统健康。
- Web 端是主要产品界面，必须承载接入、监控、复核、查询和运维闭环。
- 首版不做自动处罚、执法系统对接、云端多租户、复杂账号体系。

## 关键入口

- 项目介绍：`README.md`
- 项目说明：`docs/project-guide.md`
- 产品需求：`docs/requirements.md`
- 系统设计：`docs/detailed-design.md`
- 拓展路线：`docs/extension-roadmap.md`
- 后端入口：`backend/app/main.py`
- 后端路由：`backend/app/routers/`
- 后端服务：`backend/app/services/`
- 前端入口：`frontend/src/main.tsx`
- 前端路由：`frontend/src/App.tsx`
- 前端 API：`frontend/src/api/client.ts`
- Android 入口：`android/app/src/main/java/com/emergency/lane/MainActivity.kt`
- Android 导航：`android/app/src/main/java/com/emergency/lane/ui/EmergencyLaneNavHost.kt`
- Android 上传：`android/app/src/main/java/com/emergency/lane/data/remote/`
- Android 检测：`android/app/src/main/java/com/emergency/lane/camera/`

## 验证命令

后端：

```bash
cd backend
uv run pytest tests/ -q
```

前端：

```bash
cd frontend
bun run lint
bun run build
```

Android：

```bash
cd android
./gradlew assembleDebug
```

## 文档约束

- `README.md` 只写项目介绍、价值、快速启动和文档入口。
- `docs/` 写详细说明，不把细节塞进 README。
- 不再把历史执行计划当作产品文档主入口。
- 文档里的功能状态必须和当前代码一致；未实现能力要明确标为“后续扩展”。
