# Emergency Lane Detection

一个面向本地长期演示和人工复核的高速应急车道疑似占用检测系统。

系统由 Android 端、HP 电脑本地后端和 Web 工作台组成，目标是跑通并产品化这条核心闭环：

```text
手机端采集和检测
  -> 生成疑似占用事件
  -> 上传到 HP 本地服务
  -> Web 查看证据和设备状态
  -> 人工复核
  -> 持续监控系统健康
```

## 当前产品形态

- Android App：相机采集、ROI 标定、车辆检测、疑似事件生成、本地队列和上传。
- FastAPI 后端：设备注册、心跳、事件接收、证据保存、复核状态、统计和系统状态。
- React Web：工作台、接入向导、复核队列、事件查询、设备运营、系统健康和运行设置。

项目不是自动执法系统。当前定位是本地部署、人工辅助复核、可持续演示和迭代的产品原型。

## 快速启动

启动后端：

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

启动前端：

```bash
cd frontend
bun install
bun run dev --host 0.0.0.0
```

构建 Android：

```bash
cd android
./gradlew assembleDebug
```

Android 端需要配置为 HP 电脑的局域网地址，例如：

```text
http://192.168.x.x:8000
```

不能使用手机本机的 `localhost`。

## 常用验证

```bash
cd backend && uv run pytest tests/ -q
cd frontend && bun run lint
cd frontend && bun run build
```

## 文档入口

- `docs/project-guide.md`：项目结构、运行方式和主要接口。
- `docs/requirements.md`：产品目标、用户角色、功能范围和页面要求。
- `docs/detailed-design.md`：Android、backend、frontend 的系统设计。
- `docs/extension-roadmap.md`：从当前版本继续产品化的拓展路线。

## 技术栈

- Android：Kotlin、Jetpack Compose、CameraX、TFLite、Room、DataStore、WorkManager、Retrofit。
- Backend：Python、FastAPI、SQLite、pytest、uv。
- Frontend：React、TypeScript、Vite、Tailwind CSS、Bun、lucide-react。
