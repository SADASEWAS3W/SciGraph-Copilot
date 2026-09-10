# SciGraph Copilot 前端实现报告

## 交付范围

本次实现完成 `FRONTEND_DEVELOPMENT_PLAN.md` 中六个阶段的前端代码交付，并直接采用仓库现有 API 和 SSE 事件作为已接受契约。

### 阶段 1：基础与契约

- 将产品元数据、页面语言和主要界面更新为 SciGraph Copilot 中文工作区。
- 建立知识图谱、数据看板、AI 问答、项目与演示五个清晰入口。
- 新增严格类型的 SSE 解析工具和图谱分析适配层。
- 保留项目、索引、模型配置和图谱 API 的既有边界。

### 阶段 2：AI 问答

- 将 `ChatPanel` 接入主页面右侧抽屉。
- 支持 DRIFT、local、global 和 basic 查询模式。
- 展示连接、生成、停止、失败和完成状态，以及 Agent 执行步骤和耗时。
- 使用 `AbortController` 停止请求，并在组件卸载、清空或发起新请求时清理连接。
- 解析错误恢复提示、引用标记和相关实体；实体可以跳转到 3D 图谱。
- 图谱当前实体会作为问答上下文提交。

### 阶段 3：科研数据看板

- 引入 ECharts 6，并通过动态导入将看板移出图谱首屏代码路径。
- 封装负责初始化、ResizeObserver、点击事件和销毁的统一 ECharts 组件。
- 实现实体类型柱状图、社区矩形树图、关系桑基图、社区层级趋势图和核心实体热力图。
- 支持图片导出、缩放、渐进渲染和图表到图谱的实体/类型联动。

### 阶段 4：3D 图谱与性能

- 启用实体类型、社区层级、关系权重和社区边界筛选。
- 保留搜索、选中、Inspector 和社区隔离同步。
- 对 1,000 个以上节点使用 Web Worker 计算确定性的初始球面布局。
- 5,000 个以上节点关闭高成本后处理并降低几何体精度；超过 5,000 个节点跳过主线程迭代力模拟。
- 节点分批进入场景；大图谱只显示按中心性排序的有限标签。
- 1,500 个以上节点切换为 `InstancedMesh`，避免为每个节点创建独立材质和逐帧回调。
- 根据规模调整像素比、星空数量、Bloom 和 Vignette。
- 补充节点材质、共享几何体、背景材质和后处理资源清理。

### 阶段 5：演示路径

- 新增应用内 AI4Science 演示向导。
- 串联“上传资料 → 构建图谱 → AI 提问 → 核对证据 → 定位实体 → 看板分析”。
- 提供三个固定示例问题和当前项目、实体、关系摘要。

### 阶段 6：测试与作品化

- 新增 Vitest 测试入口。
- 覆盖 SSE 的 CRLF、分块与错误数据处理。
- 覆盖图谱统计、悬空关系过滤和社区层级聚合。
- 覆盖 6,000 节点快速降级布局路径。
- 更新 README，区分上游 GraphRAG Workbench 与 SciGraph Copilot 前端扩展。

## 前端数据流

```text
/api/corpus/state + /api/data/*
              │
              ▼
       GraphDataLoader
              │
      ┌───────┴────────┐
      ▼                ▼
ForceSimulation3D   graphAnalytics
      │                │
      ▼                ▼
3D Graph/Inspector  ECharts Dashboard
      ▲                │
      └──── shared entity selection ────┐
                                        │
/api/chat/stream → SSE parser → ChatPanel
```

页面只调用应用 API，不读取本地文件、不启动进程，也不接收模型密钥。实体 ID 是问答、图谱、Inspector 和看板之间的共享标识。

## 性能策略与证据

自动化大图检查使用 6,000 个实体和 5,999 条关系，验证快速降级路径不会进入迭代式主线程力模拟，并确保所有坐标有效。最近一次测试运行中该用例耗时 226ms；此数据只代表布局准备，不代表 WebGL 帧率。

浏览器 FPS、GPU 内存、1k/5k/10k 首屏加载时间必须在最终演示设备和真实 GraphRAG 数据上测量。项目不会用 Node.js 布局耗时替代浏览器渲染指标。

## 验证命令

开发过程中执行：

```powershell
pnpm test
pnpm typecheck
pnpm exec eslint app/page.tsx app/layout.tsx components/ChatPanel.tsx components/EChart.tsx components/AnalyticsDashboard.tsx components/GraphFilters.tsx components/DemoGuide.tsx components/GraphVisualizer.tsx lib/chatStream.ts lib/graphAnalytics.ts lib/forceSimulation.ts workers/graphLayout.worker.ts
```

全部实现结束后按 Agent Harness 要求只执行一次：

```powershell
pnpm harness:quality
```

## 人工验收清单

- 打开项目面板，确认新建、导入、上传、构建、停止和错误提示。
- 打开 AI 问答，检查四种模式、增量回答、停止生成、步骤、引用标记和实体跳转。
- 从图谱选择实体，再打开问答，确认上下文实体正确显示。
- 在看板点击实体类型、桑基节点和热力图单元格，确认返回图谱并保持选择。
- 使用实体类型、关系权重和社区层级筛选，检查节点、关系和社区边界。
- 依次检查 1k、5k、10k 数据，记录加载时间、布局耗时、FPS、点击反馈和 GPU/页面内存。
- 在窄屏下检查顶部导航、项目抽屉、问答抽屉、Inspector 和看板滚动。
