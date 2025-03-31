/**
 * Agent SDK
 * 一个可扩展的 Agent 开发库
 */

import { ContextManager, Message } from './core/ContextManager';
import { StateManager, AgentState } from './core/StateManager';
import { IntentRecognizer, Intent, IntentResult, IntentHandler } from './core/IntentRecognizer';
import { ToolManager, Tool, ExecuteResult } from './core/ToolManager';
import { PromptManager, PromptTemplate } from './core/PromptManager';

export interface AgentConfig {
  name: string;
  version: string;
  description?: string;
  minConfidence?: number;
  defaultPrompts?: PromptTemplate[];
}

export interface AgentResponse {
  content: string;
  intent?: Intent;
  toolName?: string;
  toolResult?: string;
}

// 重新导出所有核心类型
export {
  ContextManager, Message,
  StateManager, AgentState,
  IntentRecognizer, Intent, IntentResult, IntentHandler,
  ToolManager, Tool, ExecuteResult,
  PromptManager, PromptTemplate
};

export class Agent {
  private config: AgentConfig;
  private contextManager: ContextManager;
  private stateManager: StateManager;
  private toolManager: ToolManager;
  private promptManager: PromptManager;
  
  // 将intentRecognizer改为公共属性
  public intentRecognizer: IntentRecognizer;
  
  /**
   * 创建 Agent 实例
   * @param config Agent 配置
   */
  constructor(config: AgentConfig) {
    this.config = {
      minConfidence: 0.7,
      ...config
    };
    
    // 初始化各模块
    this.contextManager = new ContextManager();
    this.stateManager = new StateManager();
    this.intentRecognizer = new IntentRecognizer({ 
      minConfidence: this.config.minConfidence 
    });
    this.toolManager = new ToolManager();
    this.promptManager = new PromptManager();
    
    // 加载默认提示模板
    if (this.config.defaultPrompts) {
      this.promptManager.addPromptTemplates(this.config.defaultPrompts);
    }
  }
  
  /**
   * 处理用户消息
   * @param userInput 用户输入
   * @returns 响应结果
   */
  async handleMessage(userInput: string): Promise<AgentResponse> {
    // 添加用户消息到上下文
    this.contextManager.addMessage({
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    });
    
    // 获取当前状态和上下文
    const currentState = this.stateManager.getState();
    const context = this.contextManager.getContext();
    
    try {
      // 分析用户意图
      const intentResult = await this.intentRecognizer.detectIntent(
        userInput,
        context,
        currentState
      );
      
      // 根据意图类型处理
      switch (intentResult.intent) {
        case 'call_tool':
          return await this._handleToolCall(intentResult);
          
        case 'continue_flow':
          return await this._handleContinueFlow(intentResult);
          
        case 'clarify_input':
          return await this._handleClarification(intentResult);
          
        case 'chit_chat':
        default:
          return await this._handleChitChat(intentResult);
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
      return {
        content: '抱歉，我遇到了一些问题，无法完成您的请求。'
      };
    }
  }
  
  /**
   * 注册工具
   * @param tool 工具对象
   */
  registerTool(tool: Tool): void {
    this.toolManager.registerTool(tool);
  }
  
  /**
   * 批量注册工具
   * @param tools 工具数组
   */
  registerTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.toolManager.registerTool(tool);
    }
  }
  
  /**
   * 添加提示模板
   * @param name 模板名称
   * @param template 模板内容
   * @param description 可选的描述
   */
  addPromptTemplate(name: string, template: string, description?: string): void {
    this.promptManager.addPromptTemplate(name, template, description);
  }
  
  /**
   * 获取 Agent 名称
   * @returns Agent 名称
   */
  getName(): string {
    return this.config.name;
  }
  
  /**
   * 获取 Agent 版本
   * @returns Agent 版本
   */
  getVersion(): string {
    return this.config.version;
  }
  
  /**
   * 获取 Agent 描述
   * @returns Agent 描述或空字符串
   */
  getDescription(): string {
    return this.config.description || '';
  }
  
  /**
   * 重置 Agent 状态
   */
  reset(): void {
    this.contextManager.clearContext();
    this.stateManager.resetState();
  }
  
  /**
   * 处理工具调用意图
   * @param intentResult 意图结果
   * @returns 响应结果
   */
  private async _handleToolCall(intentResult: IntentResult): Promise<AgentResponse> {
    const { tool: toolName, parameters } = intentResult;
    
    if (!toolName) {
      this.stateManager.setState('awaiting_user_input');
      return {
        content: '我需要知道您想使用哪个工具?',
        intent: intentResult.intent
      };
    }
    
    // 保存工具参数以供后续使用
    if (parameters) {
      this.contextManager.saveToolArgs(toolName, parameters);
    }
    
    // 执行工具调用
    const toolResult = await this.toolManager.executeTool(toolName, parameters || {});
    
    if (!toolResult.success) {
      // 如果缺少参数，进入等待状态
      if (toolResult.missingParams && toolResult.missingParams.length > 0) {
        const missingParam = toolResult.missingParams[0];
        this.stateManager.setState(`waiting_for_${missingParam}`);
        this.stateManager.setInterruptedTool(toolName);
        
        return {
          content: `请提供${missingParam}参数`,
          intent: intentResult.intent,
          toolName
        };
      }
      
      // 其他错误
      return {
        content: `工具执行出错: ${toolResult.error}`,
        intent: intentResult.intent,
        toolName
      };
    }
    
    // 工具调用成功
    this.stateManager.setState('idle');
    this.contextManager.addMessage({
      role: 'system',
      content: `工具 ${toolName} 执行结果: ${toolResult.result}`,
      timestamp: Date.now()
    });
    
    return {
      content: toolResult.result,
      intent: intentResult.intent,
      toolName,
      toolResult: toolResult.result
    };
  }
  
  /**
   * 处理继续流程意图
   * @param intentResult 意图结果
   * @returns 响应结果
   */
  private async _handleContinueFlow(intentResult: IntentResult): Promise<AgentResponse> {
    const { parameters } = intentResult;
    
    // 获取中断的工具名称
    const toolName = this.stateManager.getInterruptedTool();
    
    if (!toolName) {
      this.stateManager.setState('idle');
      return {
        content: '我不知道您想继续什么操作',
        intent: intentResult.intent
      };
    }
    
    // 获取之前保存的参数
    const previousArgs = this.contextManager.getLastToolArgs();
    
    // 合并新参数
    const fullArgs = { ...previousArgs, ...parameters };
    
    // 重新执行工具
    const toolResult = await this.toolManager.executeTool(toolName, fullArgs);
    
    // 更新保存的参数
    this.contextManager.saveToolArgs(toolName, fullArgs);
    
    if (!toolResult.success) {
      // 如果仍然缺少参数
      if (toolResult.missingParams && toolResult.missingParams.length > 0) {
        const missingParam = toolResult.missingParams[0];
        this.stateManager.setState(`waiting_for_${missingParam}`);
        
        return {
          content: `请提供${missingParam}参数`,
          intent: intentResult.intent,
          toolName
        };
      }
      
      // 其他错误
      this.stateManager.setState('idle');
      return {
        content: `工具执行出错: ${toolResult.error}`,
        intent: intentResult.intent,
        toolName
      };
    }
    
    // 工具调用成功
    this.stateManager.setState('idle');
    this.contextManager.addMessage({
      role: 'system',
      content: `工具 ${toolName} 执行结果: ${toolResult.result}`,
      timestamp: Date.now()
    });
    
    return {
      content: toolResult.result,
      intent: intentResult.intent,
      toolName,
      toolResult: toolResult.result
    };
  }
  
  /**
   * 处理澄清意图
   * @param intentResult 意图结果
   * @returns 响应结果
   */
  private async _handleClarification(intentResult: IntentResult): Promise<AgentResponse> {
    this.stateManager.setState('awaiting_user_input');
    
    try {
      // 尝试加载澄清提示模板
      const promptText = this.promptManager.loadPrompt('need_clarification');
      return {
        content: promptText,
        intent: intentResult.intent
      };
    } catch (error) {
      // 使用默认提示
      return {
        content: '请提供更多信息，以便我更好地理解您的需求。',
        intent: intentResult.intent
      };
    }
  }
  
  /**
   * 处理闲聊意图
   * @param intentResult 意图结果
   * @returns 响应结果
   */
  private async _handleChitChat(intentResult: IntentResult): Promise<AgentResponse> {
    // 尝试加载问候模板
    try {
      const promptText = this.promptManager.loadPrompt('greeting', {
        name: this.config.name,
        description: this.config.description || '智能助手'
      });
      return {
        content: promptText,
        intent: intentResult.intent
      };
    } catch (error) {
      // 使用默认回复
      return {
        content: `您好，我是${this.config.name}，有什么可以帮您的吗？`,
        intent: intentResult.intent
      };
    }
  }
}

export default Agent; 