# AGENTS.md

## 原则

- 先读现有实现和 `docs/` 文档，再改代码。
- 保持改动小而准，不做无关重构。
- 不破坏 Android、backend、frontend 之间的数据契约。
- 后端行为变更要补或改测试。
- 不覆盖用户已有未提交修改。
- 不能运行验证命令时，要说明命令和原因。

## 关键入口

- 项目说明：`docs/project-guide.md`
- 需求文档：`docs/requirements.md`
- 详细设计：`docs/detailed-design.md`
- 验收说明：`docs/acceptance-phase5.md`
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

