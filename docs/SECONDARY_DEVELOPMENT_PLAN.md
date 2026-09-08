# SciGraph Copilot 二次开发计划

> 基于 GraphRAG Workbench 2.0，面向 AI 大模型 Web 应用、AI4Science 可视化平台和 AI 业务管理平台岗位要求制定。

## 1. 文档目的

本计划用于把当前 GraphRAG Workbench 从“本地文档知识图谱浏览工具”逐步升级为一个可演示、可量化、可持续迭代的 AI4Science Web 平台。项目暂定名为 **SciGraph Copilot**。

计划强调四件事：

1. 每个阶段都能独立交付和验收，避免长期开发后才第一次集成。
2. 所有技术选型都服务于岗位能力证明，而不是单纯堆砌技术名词。
3. 大规模渲染和性能优化必须有数据集、测试方法和指标，不以主观“流畅”作为结论。
4. 保留现有 GraphRAG Workbench 的可用能力，通过分层和适配器逐步演进，不整体重写。

## 2. 岗位要求与项目目标映射

| 岗位要求 | 本项目对应能力 | 主要交付阶段 |
| --- | --- | --- |
| AI 相关 Web 平台核心开发 | 文档导入、GraphRAG 构建、流式问答、项目管理 | 阶段 1、2 |
| 大模型交互系统 | SSE 流式响应、查询模式切换、会话状态、错误恢复 | 阶段 2 |
| AI4Science 可视化 | 科研文献、实体、关系、实验指标、Embedding 联动分析 | 阶段 3、5、6 |
| 多模态展示 | PDF 原文、文本证据、图片/表格元数据与实体联动 | 阶段 6 |
| 实验数据可视化 | ECharts 趋势、分布、热力图、平行坐标、桑基图 | 阶段 3 |
| Agent 编排 | LangGraph 状态图、查询规划、检索、证据整理、图表生成的可视化轨迹 | 阶段 2、7 |
| 大规模复杂 Web 应用 | 工作台路由、领域状态、数据适配层、错误边界 | 阶段 1 |
| ECharts、D3.js、WebGL | ECharts 分析看板、d3-force-3d 3D 模式、WebGL 大图模式 | 阶段 3、4 |
| 大规模数据渲染 | 10 万节点/30 万边目标、GPU 渲染、LOD、聚合、Worker | 阶段 4 |
| 首屏、渲染、内存优化 | 性能埋点、分片加载、对象复用、性能预算 | 阶段 0、4、8 |
| Webpack/Vite 等工程化 | Next.js/Turbopack、依赖边界、测试、CI、Bundle 分析 | 阶段 0、1、8 |
| 前沿技术预研与落地 | WebGL/WebGPU 双路径和 Embedding Atlas 技术调研 | 阶段 5 |
| Git 协作与文档习惯 | Git 基线、ADR、PR 模板、测试报告、阶段复盘 | 全阶段 |

## 3. 当前代码基线

### 3.1 已有能力

当前代码不是空白脚手架，以下能力应保留并复用：

- `Next.js 16.2 + React 19.2 + TypeScript 5` 前端基础。
- 基于 Radix UI、Tailwind CSS 和可调整面板的桌面式工作台界面。
- Microsoft GraphRAG 3.1.0 的本地运行适配。
- Ollama/OpenAI 构建配置和供应商状态检查。
- PDF 转文本、文件上传/移除、索引启动/停止和项目归档。
- 索引任务 SSE 事件、持久日志和失败模式识别。
- `Three.js + React Three Fiber + d3-force-3d` 三维知识图谱。
- 实体、关系、社区、社区报告等 Parquet/JSON 转换和加载。
- 图谱搜索、实体选择、社区层级、Inspector 和 RAG 节点高亮。
- GraphRAG drift/local/global/basic 查询以及 SSE 聊天输出。
- 图谱节点渐进挂载、搜索防抖、共享几何体/材质等初步优化。

### 3.2 当前主要缺口

| 缺口 | 当前表现 | 改造方向 |
| --- | --- | --- |
| 缺少工程基线 | 当前目录没有 `.git` 元数据，缺少自动化测试脚本 | 建立 Git、测试、CI、质量门禁和性能基线 |
| 页面职责集中 | `app/page.tsx` 同时管理数据、构图、选择、面板和加载状态 | 引入工作台路由、领域 store、服务与适配层 |
| 领域类型重复 | Chat API 内重新定义 Entity/Relationship | 建立共享 schema，并在边界处用 Zod 校验 |
| 聊天证据不够可靠 | 通过答案/问题字符串匹配实体 ID 生成高亮 | 输出结构化 citation、evidence、entityIds 和 retrieval trace |
| 缺少 ECharts | 当前使用 Recharts，尚无岗位指定的 ECharts 能力 | 建立 ECharts 组件层和联动分析看板 |
| 图谱规模受限 | 每个节点和边对应 React/Three 对象，力导向布局在主线程预计算 | 增加 GPU 批量渲染、大图模式、Worker、LOD 和聚合 |
| 缺少 Embedding 视图 | 没有向量投影、聚类、相似点检索 | 增加二维 Embedding 地图及跨视图联动 |
| 多模态证据不足 | PDF 转纯文本后缺少页码、原文高亮和图片/表格定位 | 建立 source/citation 模型和文献阅读器 |
| 缺少可观测性 | 没有系统记录首屏、帧率、内存、查询阶段耗时 | 增加前端性能面板和服务端 trace |
| 缺少可验证指标 | 尚无固定规模数据集和基准报告 | 建立 1k/10k/100k 节点分级基准 |

## 4. 目标产品范围

### 4.1 核心用户流程

1. 用户创建科研项目并上传论文、实验记录或已有 GraphRAG 输出。
2. 系统完成文档解析、实体关系抽取、社区聚类和向量索引。
3. 用户在 AI 对话中提出科研问题，查看流式答案、检索步骤和引用证据。
4. 回答中的引用可以定位到原文，并联动高亮知识图谱节点。
5. 用户在 ECharts 看板中分析研究主题、实体关系和实验指标。
6. 用户在 3D 精细图、WebGL 大图和 Embedding 地图之间切换。
7. 所有视图共享筛选条件和选中状态，形成“问答—证据—图谱—统计”闭环。

### 4.2 本轮非目标

- 第一轮不做完整 SaaS 多租户、计费和企业权限体系。
- 第一轮不训练自有大模型，只完成模型供应商适配和推理应用。
- 第一轮不同时覆盖气象、药物、材料三个行业，先选一个示例数据域。
- 不在缺少基准数据的情况下宣称“百万级”或“60 FPS”。
- 不为追求技术数量同时维护多套功能重复的图表框架。

### 4.3 推荐示例领域

首个演示域建议选择“药物/生物医学文献知识发现”，原因是实体关系直观，易获得公开论文摘要数据，也便于展示药物—靶点—疾病—试验—指标的复杂关系。若现有个人经历更偏材料或气象，只替换领域 schema 和示例数据，不改变平台架构。

## 5. 目标架构

```text
浏览器
├─ Workspace Shell（Next.js / React / TypeScript）
├─ AI Chat（SSE、结构化事件、引用、Trace）
├─ Analytics（ECharts、交叉筛选、实验看板）
├─ Graph Views
│  ├─ Detail 3D（React Three Fiber + d3-force-3d）
│  └─ Large Graph（cosmos.gl/WebGL，GPU 批量渲染）
├─ Embedding View（WebGL/WebGPU，二维投影与套索选择）
└─ Source Viewer（PDF/文本证据/多模态附件）
              │
              ▼
Next.js Route Handlers / Application Services
├─ Project & Corpus Service
├─ LangGraph Gateway（SSE 转发、取消、鉴权、协议转换）
├─ Graph/Analytics API
├─ Citation & Source API
└─ Telemetry API
              │
              ▼
Python AI Runtime
├─ LangGraph（状态、分支、重试、工具编排、Checkpoint）
├─ GraphRAG 3.1（索引、社区分析、图检索）
├─ Model Providers（OpenAI / Ollama）
└─ Parquet / LanceDB / Local Files
```

架构原则：

- UI 组件不直接理解 GraphRAG 文件目录，统一通过 application service 和 DTO 获取数据。
- 3D 图、大图和 Embedding 图共享 selection/filter store，但各自维护相机和渲染状态。
- 服务端事件采用带版本的判别联合类型，禁止在 UI 内通过字符串猜测事件形态。
- LangGraph 只负责编排，不替代 GraphRAG；GraphRAG 作为检索节点或工具被状态图调用。
- Next.js 不承载 LangGraph 运行状态，只负责 Web 边界和事件转发；Python runtime 是工作流执行源。
- 图表、图谱只消费规范化的数据集，转换和采样放在 Worker 或服务端完成。
- 对关键技术决策建立 `docs/adr/`，记录背景、选择和取舍。

### 5.1 LangGraph、LangChain 与 GraphRAG 的职责边界

| 组件 | 本项目职责 | 是否替代现有能力 |
| --- | --- | --- |
| Microsoft GraphRAG | 文档索引、实体关系抽取、社区分析、local/global/drift 等图检索 | 保留，是知识检索核心 |
| LangGraph | 工作流状态、条件分支、重试、取消、checkpoint、工具编排 | 新增，替换当前手写顺序编排 |
| LangChain Core | 仅在需要标准消息/工具协议时使用 | 可选，不引入完整 LangChain 应用层 |
| Next.js API | 浏览器边界、鉴权、参数校验、SSE 转发 | 保留，但减少 AI 编排职责 |

引入原则：先使用 LangGraph 解决可观察的编排问题，再扩展工具型 Agent。不能保留一套手写流程并额外包装一层“空状态图”；迁移完成后，问答执行的唯一事实来源应是 LangGraph run。

## 6. 阶段执行总览

按单人、每周约 20～30 小时估算，总周期约 13～16 周。时间是规划值，阶段是否完成以验收标准为准。

| 阶段 | 建议周期 | 阶段成果 | 对岗位的核心证明 |
| --- | --- | --- | --- |
| 0. 工程基线与性能测量 | 1 周 | 可重复运行、测试和基线报告 | 工程化、问题排查 |
| 1. 前端架构重构 | 1～2 周 | 多工作区、共享状态、数据契约 | 大型复杂 Web 架构 |
| 2. LangGraph 对话与证据链 | 2～3 周 | 状态图、结构化流、引用、Trace、联动 | 大模型交互、LangGraph 基础编排 |
| 3. ECharts 分析中心 | 2 周 | 复杂图表及多图联动 | ECharts、实验可视化 |
| 4. WebGL 大规模图谱 | 2～3 周 | 10 万节点级大图模式 | WebGL、大规模渲染、性能优化 |
| 5. Embedding 可视化 | 1～2 周 | 聚类、近邻、套索和联动 | AI 可视分析、前沿预研 |
| 6. AI4Science 多模态闭环 | 1～2 周 | 原文证据和领域化演示 | AI4Science、多模态 |
| 7. LangGraph Agent 分析与图表生成 | 1～2 周 | 条件路由、工具编排、Checkpoint 和安全图表 DSL | Agent 编排、创新交互 |
| 8. 质量、优化与作品化 | 1～2 周 | CI、性能报告、演示和文档 | 性能调优、交付能力 |

## 7. 分阶段详细计划

## 阶段 0：工程基线与性能测量

### 目标

建立安全可回退、可重复验证的开发基础，并测清当前版本的真实上限。

### 任务

- 初始化或恢复 Git 仓库，记录上游版本和二次开发起点。
- 创建 `develop` 和按阶段划分的 feature branch 约定。
- 固化 Node、pnpm、Python、uv 版本和本地启动步骤。
- 补充 `.env.example`，梳理敏感配置和本地数据忽略规则。
- 运行并记录现有 `typecheck`、`lint`、`build` 结果。
- 引入 Vitest、React Testing Library 和 Playwright，先建立最小冒烟测试。
- 建立可重复的模拟图数据生成器，至少输出：
  - S：1,000 节点 / 3,000 边；
  - M：10,000 节点 / 30,000 边；
  - L：100,000 节点 / 300,000 边。
- 增加开发态性能采集：数据读取、布局耗时、首次图谱可见时间、FPS、JS heap、节点选择响应时间。
- 形成 `docs/baseline-performance.md`，如实记录失败规模和瓶颈。

### 主要影响目录

- `package.json`
- `.env.example`
- `tests/`
- `scripts/benchmark/`
- `docs/baseline-performance.md`
- `.github/workflows/`

### 验收标准

- 新环境可按 README 从零启动。
- `pnpm typecheck`、`pnpm lint`、`pnpm build` 有明确结果。
- Playwright 能完成“打开首页—导入/加载样例—看到图谱”的冒烟流程。
- 三档模拟数据可以确定性生成，随机种子和规模写入报告。
- 基线报告包含至少一组 Chrome Performance 截图或导出数据。

### 阶段退出条件

未得到当前版本在 1k/10k/100k 数据上的测量结果前，不进入大图优化结论阶段。

## 阶段 1：前端架构重构与数据契约

### 目标

把当前单页状态拆成可扩展的工作台架构，为聊天、看板、图谱和 Embedding 联动打基础。

### 任务

- 将工作台拆为 `graph`、`analytics`、`embedding`、`sources` 四个视图入口。
- 把 `app/page.tsx` 中的数据加载、构图、选择和面板状态迁移到领域 hooks/store。
- 推荐使用 Zustand 管理跨视图状态：
  - 当前项目；
  - 选中实体/社区；
  - RAG 高亮实体；
  - 全局筛选条件；
  - 时间范围和实验选择。
- 建立共享类型：`GraphDataset`、`Entity`、`Relationship`、`Community`、`Citation`、`QueryTrace`。
- 使用 Zod 校验 API 请求、SSE 事件、GraphRAG JSON/Parquet 转换结果。
- 抽取 `graphRepository`、`queryService`、`projectService` 等边界，避免组件直接调用散落的 API。
- 增加 Error Boundary、空状态、取消请求和统一错误结构。
- 保证现有上传、构建、归档、图谱选择功能无回归。

### 建议目录

```text
features/
├─ workspace/
├─ graph/
├─ chat/
├─ analytics/
├─ embedding/
└─ sources/
lib/
├─ contracts/
├─ client/
├─ server/
└─ telemetry/
workers/
```

### 验收标准

- `app/page.tsx` 只负责页面编排，不再包含具体数据转换逻辑。
- Chat API 不再重复声明 Entity/Relationship 类型。
- 所有外部数据进入业务层前均经过 schema 校验。
- 切换工作区不丢失当前实体选择和筛选条件。
- 阶段 0 的冒烟测试全部通过。

## 阶段 2：LangGraph 对话、引用证据链与 Agent Trace

### 目标

引入 LangGraph 作为 Python 工作流编排层，把现有“流式文本 + 模糊实体高亮”升级为可解释、可追溯、可取消和可恢复的大模型交互系统。本阶段只实现确定性的单次问答图，不提前引入开放式工具循环。

### 任务

- 定义版本化 SSE 协议，例如：
  - `run.started`；
  - `step.started/progress/completed/failed`；
  - `answer.delta/completed`；
  - `citations.completed`；
  - `graph.selection`；
  - `run.completed/failed`。
- 在 `pyproject.toml` 中固定兼容版本的 `langgraph`，必要时引入最小范围的 LangChain Core 消息类型；不默认引入完整 LangChain 套件。
- 新建独立 Python AI runtime，通过明确的 HTTP/SSE 或 NDJSON 进程协议与 Next.js 通信；禁止让浏览器直接访问 LangGraph。
- 定义带类型的 `ResearchQueryState`，至少包含：
  - `run_id`、`thread_id`、`question`、`query_method`；
  - `plan`、`retrieved_context`、`citations`、`entity_ids`；
  - `answer`、`errors`、`timings`、`cancelled`。
- 第一版 LangGraph 使用确定性节点和条件边：
  - `validate_input`：校验问题、项目和查询模式；
  - `plan_query`：确定 GraphRAG 查询方法和限制；
  - `run_graphrag`：调用现有 GraphRAG CLI adapter；
  - `extract_evidence`：生成结构化 citation 和实体映射；
  - `compose_answer`：整理流式答案；
  - `finalize`：汇总 trace、耗时和运行状态；
  - `handle_error`：统一失败和可恢复信息。
- 将现有 CLI stdout 解析隔离为 GraphRAG adapter，避免 Next.js route handler 直接承担全部编排。
- 让 LangGraph node 生命周期映射为统一事件协议，Next.js 仅转发/转换事件，前端不依赖 Python 内部节点实现。
- 增加 `AbortController`，支持用户停止生成和组件卸载自动取消。
- 将取消信号从浏览器贯通到 Next.js、LangGraph runtime 和 GraphRAG 子进程。
- 增加会话模型：conversation、message、query method、provider、耗时、错误状态。
- 为 `thread_id` 预留 checkpoint 边界；本阶段可使用内存或 SQLite checkpoint，但必须通过接口隔离，避免业务代码绑定存储实现。
- 把 citation 设计成结构化数据：文档 ID、页码/段落、文本片段、实体 ID、相关性分数。
- 答案中的引用点击后：
  - 打开来源面板；
  - 定位证据段落；
  - 高亮对应图谱节点和关系。
- 增加 Agent/GraphRAG 执行轨迹：查询规划、检索方法、命中文档、上下文构建、答案生成。
- 对失败、超时、供应商不可用、无检索结果分别给出可恢复 UI。
- 增加 Markdown、代码块、表格和引用标记的安全渲染。

### 验收标准

- 首个 token 时间、总耗时和各步骤耗时可见。
- 用户可以中止一次查询，并立即开始下一次查询。
- 任一引用都能解析到结构化 source；无法定位时明确标记，而不是伪造页码。
- 点击引用能够联动来源视图和图谱。
- SSE 断开、重复事件和不完整事件有自动化测试。
- LangGraph 状态迁移、条件分支、节点失败和重试具有 Python 单元测试。
- 相同输入与固定 mock 检索结果能得到确定的节点执行顺序和结构化输出。
- 取消请求后，GraphRAG 子进程和 LangGraph run 均停止，不残留后台任务。
- 不再以纯字符串匹配作为唯一的实体证据来源；字符串匹配只能作为降级策略。

### 阶段 2 推荐状态图

```text
START
  ↓
validate_input ──invalid──→ handle_error
  ↓ valid
plan_query
  ↓
run_graphrag ──failed──→ handle_error
  ↓ success
extract_evidence
  ↓
compose_answer
  ↓
finalize
  ↓
END
```

### 阶段 2 主要影响目录

- `pyproject.toml`、`uv.lock`
- `ai_runtime/graph/`：state、nodes、edges、graph factory
- `ai_runtime/adapters/`：GraphRAG CLI 和模型供应商适配
- `ai_runtime/api/`：运行、事件流和取消接口
- `lib/contracts/agent-events.ts`
- `app/api/chat/stream/route.ts`
- `components/ChatPanel.tsx`
- `tests/agent/`

## 阶段 3：ECharts 实验与知识分析中心

### 目标

补齐岗位明确要求的 ECharts 和复杂图表能力，并实现多图、多视图协同分析。

### 任务

- 引入 `echarts`，实现按需注册、主题、ResizeObserver、自适应和销毁逻辑。
- 建立统一 `<EChart />` 封装，处理 loading、empty、error、resize、事件解绑和导出。
- 建立 analytics 数据 API，服务端完成聚合，避免将全部原始数据传给浏览器。
- 第一版至少完成六类图表：
  - 文献/实体随时间变化的折线或面积图；
  - 实体类型与社区分布柱状图；
  - 实体—关系—主题桑基图；
  - 实验参数平行坐标图；
  - 指标相关性/混淆矩阵热力图；
  - 模型或实验对比雷达图/箱线图。
- 实现 `dataset`、`encode`、`dataZoom`、`brush`、visualMap 和 tooltip formatter。
- 实现图表间联动：框选、图例、时间范围、社区筛选共享到图谱和文献列表。
- 大数据图表验证 ECharts 的 progressive、sampling、large 模式及 Canvas/SVG 差异。
- 增加图表 PNG 导出和分析快照。

### 验收标准

- 至少六类图表使用真实项目数据或明确标记的演示数据。
- 至少三张图表共享同一个筛选状态并能反向影响知识图谱。
- 10 万点折线/散点场景有单独性能记录，交互期间主线程无明显长时间冻结。
- 图表组件卸载后不残留 resize/event listener。
- 图表配置和数据转换具有单元测试。

## 阶段 4：WebGL 大规模知识图谱

### 目标

在保留现有 3D 精细模式的同时，新增面向大数据量的 GPU 批量渲染模式。

### 技术策略

- 现有 React Three Fiber 视图作为 **Detail 3D**，适合中小规模、社区边界和沉浸式展示。
- 新增基于 `cosmos.gl` 的 **Large Graph**，集中证明 WebGL/GPU 渲染能力。
- 两个渲染器实现统一 `GraphRendererAdapter`，共享选择、筛选、高亮和相机定位语义。
- 不用 React 为大图中的每个节点/边创建组件；数据转换为 TypedArray/引擎原生缓冲区。

### 任务

- 将布局计算和数据规范化移动到 Web Worker，避免阻塞 UI 主线程。
- 支持分片加载和渐进呈现，先节点、后关键边、再剩余边。
- 增加 LOD：
  - 远景显示社区聚合节点；
  - 中景显示关键实体和骨干关系；
  - 近景显示标签、普通节点和完整邻居。
- 增加视口裁剪、边阈值、标签预算和高亮路径专用渲染层。
- 增加 GPU picking 或渲染器提供的索引拾取。
- 在 Worker 和 UI 之间传输 ArrayBuffer，使用 transferable 避免复制。
- 设计 3D/detail 与 large/WebGL 模式切换，并保持选中实体不丢失。
- 记录初始化、缓冲区上传、首帧、稳定 FPS、交互延迟和内存。

### 分级性能目标

以下是目标值，不是当前能力声明；必须在固定硬件、浏览器和数据集上实测。

| 数据规模 | 目标 |
| --- | --- |
| 1k 节点 / 3k 边 | Detail 3D 与 Large Graph 均可流畅交互 |
| 10k 节点 / 30k 边 | Large Graph 稳态交互 ≥ 50 FPS，选择反馈 < 100ms |
| 100k 节点 / 300k 边 | Large Graph 稳态交互 ≥ 30 FPS，首个可交互画面 < 5s |

### 验收标准

- 100k/300k 数据不会因 React 元素数量造成页面失去响应。
- Worker 计算期间搜索、面板展开和取消操作仍可响应。
- 三档数据均生成性能报告，注明机器、GPU、浏览器版本和采样方式。
- Detail 3D 功能无回归，大图模式支持搜索、选择、邻居和社区过滤。
- 不达标的指标如实记录原因和下一步方案。

## 阶段 5：Embedding 可视化与相似性探索

### 目标

增加 AI/AI4Science 最有辨识度的向量空间分析，并完成前沿渲染技术预研。

### 任务

- 定义 embedding 数据契约：向量 ID、二维坐标、cluster、source、metadata。
- 后端/离线流程完成 UMAP 投影和聚类，浏览器优先消费二维结果。
- 第一版实现：缩放、平移、hover、点击、框选/套索、多字段着色和图例。
- 支持输入文本或选择实体后执行最近邻搜索。
- 选中点联动文献、图谱、聊天上下文和 ECharts 分布图。
- 对比三种方案并形成 ADR：
  - 直接集成 `embedding-atlas/react`；
  - 基于 WebGL 自建轻量视图；
  - WebGPU 渐进增强、WebGL 降级。
- 使用 feature detection，WebGPU 不可用时保证核心分析仍可运行。

### 验收标准

- 至少可交互展示 100k 个 embedding 点。
- 相似性检索结果能定位到来源文档和图谱实体。
- 套索选择可以驱动 ECharts 和图谱过滤。
- 技术预研文档包含兼容性、Bundle 体积、开发成本和性能对比，不只给结论。

## 阶段 6：AI4Science 多模态证据闭环

### 目标

从通用 GraphRAG 演示升级为有明确科研业务语义的平台。

### 任务

- 确定首个领域 schema，例如：Drug、Target、Disease、Experiment、Metric、Paper。
- 准备可公开分发的小型演示数据集和数据来源说明。
- 保留 PDF 页码、段落、表格/图片引用和实体 provenance。
- 增加来源阅读器：页码跳转、证据高亮、前后文、引用复制。
- 增加实验记录模型：参数、指标、模型、数据集、运行时间和版本。
- 对图片和表格先实现元数据及缩略图浏览，不在第一版承诺复杂视觉理解。
- 建立完整演示剧本：提问 → 检索 → 答案 → 引用 → 图谱路径 → 实验统计。

### 验收标准

- 一个领域问题可以完整走通上述闭环。
- 答案、证据、实体、关系和实验记录之间有稳定 ID 映射。
- 演示数据具有许可/来源说明，敏感数据不进入仓库。
- 至少一种 PDF 引用能准确定位到页或段落。

## 阶段 7：LangGraph Agent 分析编排与安全图表生成

### 目标

在阶段 2 的确定性 LangGraph 问答图之上，扩展条件路由、工具调用、验证和 checkpoint，让 AI 不仅回答问题，还能选择分析工具、生成可验证图表并展示执行过程。

### 任务

- 定义有限工具集：`search_sources`、`query_graph`、`find_path`、`aggregate_metrics`、`create_chart`。
- 将工具定义为有 Zod/Pydantic 输入输出契约的服务端能力，模型只选择工具和参数，实际数据访问由受控函数完成。
- 扩展 LangGraph 状态：`messages`、`intent`、`tool_calls`、`observations`、`chart_spec`、`verification`、`remaining_steps`。
- 增加 LangGraph 节点和条件边：
  - `classify_intent`：区分问答、图查询、指标分析和图表生成；
  - `select_tools`：生成受约束的工具计划；
  - `execute_tools`：并行执行无依赖只读工具；
  - `verify_evidence`：检查答案主张是否有来源支持；
  - `build_chart_spec`：生成安全图表 DSL；
  - `revise_or_finish`：根据验证结果重试一次或结束。
- 设置 `remaining_steps`、每工具超时、最大结果量和最多一次修订，防止 Agent 无限循环。
- 使用 checkpoint 支持按 `thread_id` 恢复会话，并设计显式清理策略；本地版优先 SQLite，接口保留替换空间。
- 对需要用户确认或高成本调用的节点预留 interrupt/resume 机制，但第一版不自动执行外部写操作。
- `create_chart` 输出受约束的图表 DSL，再转换为 ECharts option；禁止直接执行模型生成的 JavaScript formatter。
- 在 UI 显示计划、工具调用、输入摘要、输出摘要、耗时和失败恢复。
- 支持“把当前筛选结果生成图表”和“解释当前图表异常点”。
- 为工具参数、权限范围、最大结果量和超时增加校验。

### 验收标准

- 至少三个问题会触发不同工具链，并得到可重复结果。
- Agent 生成的图表不执行任意代码。
- 条件路由、工具循环上限、checkpoint 恢复和一次修订路径均有测试。
- 刷新页面后可以通过 `thread_id` 恢复已保存的运行记录，且过期 checkpoint 可清理。
- 工具调用失败时能给出局部结果或明确恢复路径。
- Trace 中不泄露 API Key、完整环境变量或不必要的内部日志。

### 阶段 7 推荐状态图

```text
START → classify_intent → select_tools
                              ↓
                         execute_tools
                              ↓
                       verify_evidence
                         ↙          ↘
             revise（最多 1 次）   build_chart_spec（按需）
                         ↘          ↙
                            finalize → END
```

## 阶段 8：质量、性能优化与作品化交付

### 目标

完成面向真实评审和面试展示的工程收口。

### 任务

- 完善单元、集成和 E2E 测试，覆盖核心用户流程。
- CI 执行 typecheck、lint、unit、build、关键 E2E。
- 使用 Bundle Analyzer 检查 Three.js、ECharts 和大图引擎，按工作区动态加载。
- 优化首屏：路由分包、图谱延迟加载、字体/图片策略、骨架屏。
- 检查 React Profiler、Chrome Long Task、内存增长和事件监听器泄漏。
- 增加无障碍：键盘操作、焦点管理、对比度、图表文本摘要。
- 增加错误日志脱敏、上传文件限制、路径校验和 API 输入限制。
- 更新 README、架构图、ADR、性能报告、演示视频/GIF 和部署说明。
- 整理个人贡献清单，区分上游代码和二次开发内容。

### 最终质量门禁

- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- 核心单元/集成测试通过。
- Playwright 核心路径通过。
- 无已知高危依赖漏洞或已记录风险处置。
- 阶段 0 与阶段 8 性能指标有同环境对比。
- README 可让评审者在 15 分钟内运行演示或观看完整演示材料。

## 8. 跨阶段工作约定

### 8.1 每阶段开始前

- 明确本阶段 scope 和不做事项。
- 建立 issue/任务清单和分支。
- 确认上阶段质量门禁通过。
- 保存可比较的基线截图和测试结果。

### 8.2 每阶段完成定义（Definition of Done）

- 功能已实现，不只有 UI 占位或静态假数据。
- 类型检查、lint、build 和相关测试通过。
- 新增外部输入均有校验，错误路径可观察。
- 新增复杂逻辑有单元或集成测试。
- 文档说明设计取舍和已知限制。
- 性能相关改动有前后数据，不使用无证据的提升百分比。
- 不提交 API Key、模型缓存、用户文档和大体积构建产物。

### 8.3 Git 和评审建议

- 每阶段使用独立 feature branch 和 PR。
- 一次 PR 尽量只解决一个领域问题，避免“重构 + 新功能 + 格式化”混在一起。
- Commit 使用 `feat:`、`fix:`、`refactor:`、`perf:`、`test:`、`docs:` 前缀。
- 性能优化 PR 附数据规模、硬件环境、前后指标和复现步骤。
- 合并前使用阶段验收清单自评。

## 9. 数据与性能测试方案

### 9.1 数据集

- 合成图：用于固定规模、拓扑分布和性能回归。
- GraphRAG 小型真实输出：用于功能正确性。
- 公开科研文献数据：用于最终 AI4Science 演示。
- 每个数据集记录 schema、规模、来源、许可和生成脚本版本。

### 9.2 关键指标

| 类型 | 指标 |
| --- | --- |
| 加载 | 文档加载耗时、JSON/Parquet 转换耗时、首个可见节点、可交互时间 |
| 渲染 | 平均 FPS、P95 帧耗时、GPU/JS 内存、draw calls |
| 交互 | hover、点击、搜索、筛选和视图切换延迟 |
| AI | 首 token、总响应、检索耗时、引用数量、失败率、取消耗时 |
| Web | LCP、INP、CLS、长任务数量、主包体积 |

### 9.3 测量纪律

- 性能报告必须注明硬件、浏览器、数据规模和是否为开发/生产构建。
- 至少运行三次并报告中位数，波动明显时同时报告范围。
- 优化前后使用同一提交之外的相同环境和数据。
- 不把开发服务器的 Turbopack 编译时间混入生产运行性能。

## 10. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| GraphRAG 构建耗时和模型成本过高 | 演示不可控 | 保留预构建项目导入；提供小数据集和 Ollama 路径 |
| CLI 输出格式变化 | 聊天流解析失败 | CLI adapter 隔离、契约测试、版本固定 |
| LangGraph 与现有手写聊天流程并存 | 状态不一致、重复执行、难以排错 | 阶段 2 完成后以 LangGraph run 为唯一执行源，旧流程仅保留短期 feature flag 回退 |
| LangGraph/GraphRAG 版本不兼容 | 安装失败或运行行为变化 | 固定依赖版本和 `uv.lock`，建立 mock adapter 与端到端契约测试 |
| Checkpoint 持续增长或串话 | 磁盘膨胀、会话数据混淆 | `thread_id + project_id` 隔离、TTL/显式清理、并发恢复测试 |
| Agent 工具循环失控 | 成本、延迟和不可预测性上升 | 最大步数、单工具超时、结果上限、最多一次修订和取消贯通 |
| 3D 图无法扩展到十万级 | 页面卡顿或崩溃 | 3D 作为精细模式，大图使用 GPU 批量渲染器 |
| 同时引入 ECharts、Three.js、大图引擎导致包过大 | 首屏变慢 | 工作区动态 import、路由分包、Bundle 分析 |
| WebGPU 兼容性不足 | 部分机器不可用 | WebGPU 渐进增强，WebGL/Canvas 降级 |
| citation 缺少可靠页码 | 证据链可信度不足 | 数据摄取阶段保存 provenance；无法定位时明确标记 |
| 项目范围膨胀 | 无法按阶段交付 | 坚持阶段退出条件，先闭环后扩展领域 |
| 公开数据许可不明确 | 无法发布演示 | 优先使用许可清晰的数据集并记录来源 |

## 11. 首轮执行建议

第一轮只启动阶段 0，不同时引入 ECharts 或替换渲染器。建议按以下顺序执行：

1. 确认当前下载版本与上游 commit/tag 的关系。
2. 建立 Git 基线并保护本地数据与密钥。
3. 安装依赖，执行现有质量命令。
4. 使用现有样例或最小导入项目跑通完整流程。
5. 建立三档模拟图数据生成器。
6. 完成当前 3D 图在不同规模下的性能报告。
7. 根据测量结果确认阶段 1 的重构边界和阶段 4 的渲染器接口。

阶段 0 完成后，应产出下一阶段可直接执行的 issue 列表，而不是立刻开展所有长期功能。

## 12. 最终作品成果

项目完成后至少应提供：

- 一个可以本地运行的 SciGraph Copilot Web 平台。
- 一套可公开演示的 AI4Science 数据和场景。
- ECharts 复杂分析看板。
- Three.js/d3-force-3d 精细 3D 图谱。
- WebGL 十万级大图渲染模式及基准报告。
- Embedding 聚类和相似性探索视图。
- 带引用、图谱联动和 Agent Trace 的流式问答。
- 一套由 LangGraph 驱动、可取消、可恢复、带条件分支和 checkpoint 的 Agent 工作流。
- 一组 GraphRAG 检索、指标聚合、证据验证和安全图表生成工具。
- 自动化测试、CI、ADR、架构图和演示材料。
- 一份明确区分“上游已有能力”和“个人二次开发贡献”的说明。

最终简历中的性能数据、规模数据和提升比例，必须从阶段 0～8 的实际测试报告提取，不提前虚构。
