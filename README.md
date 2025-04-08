# Agent SDK

一个可扩展的 Agent 开发库，支持上下文管理、状态管理、意图识别、工具调用等功能。

## 特性

- 🚀 简单易用的 API 设计
- 🔄 强大的上下文管理能力
- 🛠️ 灵活的工具注册和调用机制
- 🎯 可扩展的意图识别系统
- 📝 提示模板管理
- 🔒 TypeScript 支持
- 📦 模块化设计
- 🧪 完整的测试覆盖

## 安装

### 使用 npm

```bash
npm install @nio-ai/agent-sdk
```

### 使用 yarn

```bash
yarn add @nio-ai/agent-sdk
```

### 使用 pnpm

```bash
pnpm add @nio-ai/agent-sdk
```

## 快速开始

```typescript
import { Agent } from '@nio-ai/agent-sdk';

// 创建 Agent 实例
const agent = new Agent({
  name: '小助手',
  version: '1.0.0',
  description: '一个简单的智能助手'
});

// 处理用户消息
async function handleUserMessage(userInput: string) {
  const response = await agent.handleMessage(userInput);
  console.log(`Agent: ${response.content}`);
}

// 使用示例
handleUserMessage('你好');
```

## 核心功能

### 1. 上下文管理

Agent SDK 提供了上下文管理功能，可以保存和检索消息历史：

```typescript
import { ContextManager, Message } from '@nio-ai/agent-sdk';

const contextManager = new ContextManager();

// 添加消息
contextManager.addMessage({
  role: 'user',
  content: '你好',
  timestamp: Date.now()
});

// 获取上下文
const context = contextManager.getContext();
```

### 2. 工具注册与调用

您可以注册自定义工具，并由 Agent 自动调用：

```typescript
import { Agent, Tool } from '@nio-ai/agent-sdk';

// 定义工具
class WeatherTool implements Tool {
  name = 'weather';
  description = '查询城市天气';
  parameters = {
    type: 'object',
    properties: {
      city: { type: 'string', description: '城市名称' }
    },
    required: ['city']
  };
  
  async execute(args: { city: string }): Promise<string> {
    const { city } = args;
    // 实际应用中调用天气 API
    return `${city}今天晴朗，气温25°C`;
  }
}

// 注册工具
const agent = new Agent({ name: '小助手', version: '1.0.0' });
agent.registerTool(new WeatherTool());

// 处理用户消息，自动调用工具
agent.handleMessage('北京今天天气怎么样？');
```

### 3. 意图识别

可以注册自定义意图处理器：

```typescript
import { Agent, IntentHandler, IntentResult } from '@nio-ai/agent-sdk';

// 定义意图处理器
class WeatherIntentHandler implements IntentHandler {
  async handle(input: string): Promise<IntentResult | null> {
    if (input.includes('天气')) {
      return {
        intent: 'call_tool',
        tool: 'weather',
        parameters: { city: '北京' },
        confidence: 0.9
      };
    }
    return null;
  }
}

// 注册意图处理器
const agent = new Agent({ name: '小助手', version: '1.0.0' });
agent.intentRecognizer.registerIntent('weather_intent', new WeatherIntentHandler());
```

### 4. 提示模板管理

您可以定义和管理提示模板：

```typescript
import { Agent } from '@nio-ai/agent-sdk';

const agent = new Agent({ name: '小助手', version: '1.0.0' });

// 添加提示模板
agent.addPromptTemplate(
  'greeting',
  '您好，我是{{name}}，一个{{description}}。有什么可以帮您的吗？'
);
```

## 高级用例：多轮对话

Agent SDK 支持多轮对话和参数收集：

```typescript
// 第一轮对话
const response1 = await agent.handleMessage('我想查一下天气');
console.log(response1.content); // "请提供城市参数"

// 第二轮对话
const response2 = await agent.handleMessage('北京');
console.log(response2.content); // "北京今天晴朗，气温25°C"
```

## 完整示例

完整的代码示例请参考 `src/examples/demo.ts`。

## API 文档

### Agent 类

主要的 Agent 类，集成了各个功能模块：

```typescript
new Agent(config: AgentConfig)
```

参数：
- `config`: Agent 配置对象
  - `name`: Agent 名称
  - `version`: 版本号
  - `description?`: 可选描述
  - `minConfidence?`: 最低意图置信度
  - `defaultPrompts?`: 默认提示模板

方法：
- `handleMessage(userInput: string): Promise<AgentResponse>`：处理用户输入
- `registerTool(tool: Tool): void`：注册工具
- `registerTools(tools: Tool[]): void`：批量注册工具
- `addPromptTemplate(name: string, template: string): void`：添加提示模板
- `getName(): string`：获取 Agent 名称
- `getVersion(): string`：获取 Agent 版本
- `getDescription(): string`：获取 Agent 描述
- `reset(): void`：重置 Agent 状态

### 更多 API

详细的 API 文档请参考源代码注释。

## 开发

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

## 项目结构

```
agent-sdk/
├── src/
│   ├── core/           # 核心功能实现
│   ├── tools/          # 内置工具
│   ├── intents/        # 意图识别相关
│   ├── context/        # 上下文管理
│   ├── prompts/        # 提示模板
│   └── examples/       # 示例代码
├── tests/              # 测试文件
├── docs/               # 文档
└── package.json        # 项目配置
```

## 贡献指南

我们欢迎任何形式的贡献，包括但不限于：

- 提交 Issue 报告问题
- 提交 Pull Request 改进代码
- 完善文档
- 添加新的功能或工具

### 开发流程

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 添加适当的测试用例
- 保持代码简洁清晰

## 常见问题

### Q: 如何处理 Agent 的并发请求？
A: Agent SDK 设计为无状态，每个请求都会创建新的上下文，因此可以安全地处理并发请求。

### Q: 如何自定义意图识别逻辑？
A: 您可以通过实现 `IntentHandler` 接口来创建自定义的意图处理器，并通过 `agent.intentRecognizer.registerIntent()` 注册。

### Q: 支持哪些运行环境？
A: Agent SDK 支持 Node.js 12.0 及以上版本，以及现代浏览器环境。

### Q: 如何优化 Agent 的性能？
A: 可以通过以下方式优化性能：
- 使用缓存机制
- 优化上下文管理
- 合理设置意图识别的置信度阈值

## 许可证

ISC

## 联系我们

- 项目主页：[GitHub](https://github.com/jincdream/agent-sdk)
- 问题反馈：[Issues](https://github.com/jincdream/agent-sdk/issues)
- 邮件联系：support@nio-ai.com 