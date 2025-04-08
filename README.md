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

### 基础示例

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

### 完整功能示例

```typescript
import { Agent, Tool, ContextManager, Message } from '@nio-ai/agent-sdk';

// 1. 定义自定义工具
class CalculatorTool implements Tool {
  name = 'calculator';
  description = '执行基础数学计算';
  parameters = {
    type: 'object',
    properties: {
      operation: { 
        type: 'string', 
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: '运算类型'
      },
      a: { type: 'number', description: '第一个数字' },
      b: { type: 'number', description: '第二个数字' }
    },
    required: ['operation', 'a', 'b']
  };
  
  async execute(args: { operation: string; a: number; b: number }): Promise<string> {
    const { operation, a, b } = args;
    switch (operation) {
      case 'add': return `${a + b}`;
      case 'subtract': return `${a - b}`;
      case 'multiply': return `${a * b}`;
      case 'divide': return b !== 0 ? `${a / b}` : '除数不能为零';
      default: return '不支持的运算';
    }
  }
}

// 2. 创建上下文管理器
const contextManager = new ContextManager({
  maxHistory: 10, // 最多保存10条历史记录
  ttl: 3600000   // 上下文有效期1小时
});

// 3. 创建 Agent 实例
const agent = new Agent({
  name: '智能助手',
  version: '1.0.0',
  description: '一个支持数学计算的智能助手',
  minConfidence: 0.7,
  defaultPrompts: {
    greeting: '你好，我是{{name}}，我可以帮你进行数学计算。',
    error: '抱歉，我遇到了一些问题，请稍后再试。'
  }
});

// 4. 注册工具
agent.registerTool(new CalculatorTool());

// 5. 添加自定义提示模板
agent.addPromptTemplate(
  'calculation_result',
  '计算结果：{{result}}'
);

// 6. 处理用户消息的完整示例
async function handleUserInput(userInput: string) {
  try {
    // 添加用户消息到上下文
    contextManager.addMessage({
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    });

    // 处理消息
    const response = await agent.handleMessage(userInput);

    // 添加助手回复到上下文
    contextManager.addMessage({
      role: 'assistant',
      content: response.content,
      timestamp: Date.now()
    });

    // 获取完整对话历史
    const history = contextManager.getContext();
    
    return {
      response: response.content,
      history: history
    };
  } catch (error) {
    console.error('处理消息时出错:', error);
    return {
      response: '抱歉，处理您的请求时出现了错误。',
      error: error.message
    };
  }
}

// 7. 使用示例
async function runExample() {
  // 基础对话
  console.log(await handleUserInput('你好'));
  
  // 数学计算
  console.log(await handleUserInput('请帮我计算 23 加 45'));
  
  // 查看历史记录
  console.log(await handleUserInput('我们刚才聊了什么？'));
  
  // 错误处理
  console.log(await handleUserInput('请计算 10 除以 0'));
}

// 运行示例
runExample().catch(console.error);
```

### 多轮对话示例

```typescript
// 创建一个支持多轮对话的助手
const conversationAgent = new Agent({
  name: '对话助手',
  version: '1.0.0',
  description: '支持多轮对话的智能助手'
});

// 定义对话状态
interface ConversationState {
  currentTopic?: string;
  userPreferences?: Record<string, any>;
  lastAction?: string;
}

// 处理多轮对话
async function handleConversation(userInput: string, state: ConversationState) {
  // 根据上下文状态调整响应
  const response = await conversationAgent.handleMessage(userInput, {
    state,
    context: contextManager.getContext()
  });

  // 更新对话状态
  if (response.state) {
    Object.assign(state, response.state);
  }

  return {
    response: response.content,
    state
  };
}

// 使用示例
async function runConversation() {
  const state: ConversationState = {};
  
  // 第一轮对话
  const result1 = await handleConversation('我想买一台笔记本电脑', state);
  console.log('助手:', result1.response);
  
  // 第二轮对话（基于上一轮的状态）
  const result2 = await handleConversation('预算在5000左右', state);
  console.log('助手:', result2.response);
  
  // 第三轮对话
  const result3 = await handleConversation('主要用于办公', state);
  console.log('助手:', result3.response);
}

runConversation().catch(console.error);
```

## 核心功能

### 1. 上下文管理

Agent SDK 提供了强大的上下文管理功能，支持消息历史、状态管理和会话控制：

```typescript
import { ContextManager, Message, ContextConfig } from '@nio-ai/agent-sdk';

// 创建上下文管理器
const contextManager = new ContextManager({
  maxHistory: 10,        // 最多保存10条历史记录
  ttl: 3600000,         // 上下文有效期1小时
  maxTokens: 2000,      // 最大token数
  summarizeThreshold: 5  // 超过5条消息时进行摘要
});

// 添加消息
contextManager.addMessage({
  role: 'user',
  content: '你好',
  timestamp: Date.now(),
  metadata: {
    source: 'web',
    userId: 'user123'
  }
});

// 获取上下文
const context = contextManager.getContext();

// 获取摘要
const summary = await contextManager.getSummary();

// 清除过期消息
contextManager.cleanup();

// 重置上下文
contextManager.reset();

// 导出上下文
const exportedContext = contextManager.export();

// 导入上下文
contextManager.import(exportedContext);
```

### 2. 工具注册与调用

工具系统支持同步和异步操作，支持参数验证和错误处理：

```typescript
import { Agent, Tool, ToolResult, ToolError } from '@nio-ai/agent-sdk';

// 基础工具示例
class SimpleTool implements Tool {
  name = 'simple';
  description = '简单工具示例';
  parameters = {
    type: 'object',
    properties: {
      input: { type: 'string', description: '输入文本' }
    },
    required: ['input']
  };
  
  async execute(args: { input: string }): Promise<string> {
    return `处理结果: ${args.input}`;
  }
}

// 异步工具示例
class AsyncTool implements Tool {
  name = 'async';
  description = '异步操作示例';
  parameters = {
    type: 'object',
    properties: {
      delay: { type: 'number', description: '延迟时间(ms)' }
    },
    required: ['delay']
  };
  
  async execute(args: { delay: number }): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, args.delay));
    return `延迟${args.delay}ms后返回`;
  }
}

// 带验证的工具示例
class ValidationTool implements Tool {
  name = 'validation';
  description = '参数验证示例';
  parameters = {
    type: 'object',
    properties: {
      age: { 
        type: 'number',
        minimum: 0,
        maximum: 150,
        description: '年龄'
      },
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: '^[a-zA-Z]+$',
        description: '姓名'
      }
    },
    required: ['age', 'name']
  };
  
  async execute(args: { age: number; name: string }): Promise<string> {
    return `验证通过: ${args.name}, ${args.age}岁`;
  }
}

// 工具注册和使用
const agent = new Agent({ name: '工具示例', version: '1.0.0' });

// 注册单个工具
agent.registerTool(new SimpleTool());

// 批量注册工具
agent.registerTools([
  new AsyncTool(),
  new ValidationTool()
]);

// 处理工具调用
async function handleToolCall(toolName: string, args: any) {
  try {
    const result = await agent.executeTool(toolName, args);
    return result;
  } catch (error) {
    if (error instanceof ToolError) {
      console.error('工具调用错误:', error.message);
    }
    throw error;
  }
}
```

### 3. 意图识别

意图识别系统支持多种匹配策略和自定义处理器：

```typescript
import { Agent, IntentHandler, IntentResult, IntentConfig } from '@nio-ai/agent-sdk';

// 基础意图处理器
class BasicIntentHandler implements IntentHandler {
  async handle(input: string): Promise<IntentResult | null> {
    if (input.includes('天气')) {
      return {
        intent: 'weather_query',
        confidence: 0.9,
        parameters: { type: 'current' }
      };
    }
    return null;
  }
}

// 正则匹配意图处理器
class RegexIntentHandler implements IntentHandler {
  private patterns = {
    greeting: /^(你好|早上好|晚上好)/,
    farewell: /^(再见|拜拜|下次见)/,
    thanks: /^(谢谢|感谢|多谢)/
  };

  async handle(input: string): Promise<IntentResult | null> {
    for (const [intent, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(input)) {
        return {
          intent,
          confidence: 0.8,
          parameters: {}
        };
      }
    }
    return null;
  }
}

// 机器学习意图处理器
class MLIntentHandler implements IntentHandler {
  private model: any; // 实际的机器学习模型

  async handle(input: string): Promise<IntentResult | null> {
    const prediction = await this.model.predict(input);
    if (prediction.confidence > 0.7) {
      return {
        intent: prediction.intent,
        confidence: prediction.confidence,
        parameters: prediction.parameters
      };
    }
    return null;
  }
}

// 意图识别配置和使用
const agent = new Agent({
  name: '意图识别示例',
  version: '1.0.0',
  intentConfig: {
    minConfidence: 0.6,
    maxIntents: 3,
    timeout: 5000
  }
});

// 注册意图处理器
agent.intentRecognizer.registerIntent('basic', new BasicIntentHandler());
agent.intentRecognizer.registerIntent('regex', new RegexIntentHandler());
agent.intentRecognizer.registerIntent('ml', new MLIntentHandler());

// 意图识别使用示例
async function recognizeIntent(input: string) {
  const intents = await agent.intentRecognizer.recognize(input);
  return intents;
}
```

### 4. 提示模板管理

提示模板系统支持变量替换、条件逻辑和模板继承：

```typescript
import { Agent, PromptTemplate, TemplateEngine } from '@nio-ai/agent-sdk';

// 创建模板引擎
const templateEngine = new TemplateEngine({
  delimiters: ['{{', '}}'],
  escape: true
});

// 基础模板
const baseTemplate = new PromptTemplate({
  name: 'base',
  content: '你好，我是{{name}}，一个{{description}}。'
});

// 带条件的模板
const conditionalTemplate = new PromptTemplate({
  name: 'conditional',
  content: `
    {% if user.name %}
    你好，{{user.name}}！
    {% else %}
    你好，访客！
    {% endif %}
    
    {% if user.vip %}
    欢迎回来，尊贵的VIP用户！
    {% endif %}
  `
});

// 带循环的模板
const listTemplate = new PromptTemplate({
  name: 'list',
  content: `
    您有以下待办事项：
    {% for item in todos %}
    - {{item.title}} (优先级: {{item.priority}})
    {% endfor %}
  `
});

// 模板继承
const extendedTemplate = new PromptTemplate({
  name: 'extended',
  extends: 'base',
  content: `
    {{> base}}
    我可以帮您：
    {% for skill in skills %}
    - {{skill}}
    {% endfor %}
  `
});

// 使用模板
const agent = new Agent({ name: '模板示例', version: '1.0.0' });

// 注册模板
agent.registerTemplate(baseTemplate);
agent.registerTemplate(conditionalTemplate);
agent.registerTemplate(listTemplate);
agent.registerTemplate(extendedTemplate);

// 渲染模板
const context = {
  name: '助手',
  description: 'AI助手',
  user: {
    name: '张三',
    vip: true
  },
  todos: [
    { title: '完成报告', priority: '高' },
    { title: '预约会议', priority: '中' }
  ],
  skills: ['回答问题', '执行任务', '提供建议']
};

// 渲染不同模板
console.log(agent.renderTemplate('base', context));
console.log(agent.renderTemplate('conditional', context));
console.log(agent.renderTemplate('list', context));
console.log(agent.renderTemplate('extended', context));
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