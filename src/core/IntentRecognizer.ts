/**
 * 意图识别
 * 负责识别用户输入的意图
 */

import { Message } from './ContextManager';
import { AgentState } from './StateManager';
import { Tool } from './ToolManager';

export type Intent = 
  | 'call_tool' 
  | 'clarify_input' 
  | 'chit_chat' 
  | 'continue_flow'
  | `${string}_tool`;

export interface IntentResult {
  intent: Intent;
  tool?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

export interface IntentHandler {
  handle: (input: string, context: Message[], state: AgentState) => Promise<IntentResult | null>;
}

export interface IntentRecognizerOptions {
  /** 意图匹配最低置信度阈值 */
  minConfidence?: number;
  /** 额外的意图处理器 */
  customHandlers?: Map<string, IntentHandler>;
}

export class IntentRecognizer {
  private registeredIntents: Map<string, IntentHandler> = new Map();
  private minConfidence: number;
  
  constructor(options: IntentRecognizerOptions = {}) {
    this.minConfidence = options.minConfidence || 0.7;
    
    // 初始化自定义处理器
    if (options.customHandlers) {
      for (const [intent, handler] of options.customHandlers.entries()) {
        this.registerIntent(intent, handler);
      }
    }
  }
  
  /**
   * 注册意图处理器
   * @param intent 意图名称
   * @param handler 处理器对象
   */
  registerIntent(intent: string, handler: IntentHandler): void {
    this.registeredIntents.set(intent, handler);
  }
  
  /**
   * 检测用户输入的意图
   * @param input 用户输入
   * @param context 上下文消息
   * @param currentState 当前状态
   * @returns 意图识别结果
   */
  async detectIntent(
    input: string, 
    context: Message[],
    currentState: AgentState
  ): Promise<IntentResult> {
    // 首先检查是否处于等待状态，如果是则优先考虑"继续流程"意图
    if (currentState.startsWith('waiting_for_')) {
      const continueFlowResult = await this._checkContinueFlow(input, context, currentState);
      if (continueFlowResult && continueFlowResult.confidence >= this.minConfidence) {
        return continueFlowResult;
      }
    }
    
    // 尝试所有已注册的意图处理器
    const results: IntentResult[] = [];
    
    for (const [intentName, handler] of this.registeredIntents.entries()) {
      try {
        const result = await handler.handle(input, context, currentState);
        if (result && result.confidence >= this.minConfidence) {
          results.push(result);
        }
      } catch (error) {
        console.error(`意图处理器 ${intentName} 出错:`, error);
      }
    }
    
    // 如果有匹配结果，返回置信度最高的
    if (results.length > 0) {
      results.sort((a, b) => b.confidence - a.confidence);
      return results[0];
    }
    
    // 默认返回闲聊意图
    return {
      intent: 'chit_chat',
      confidence: 0.5
    };
  }
  
  /**
   * 获取工具名与用户输入的相似度映射
   * @param input 用户输入
   * @param tools 可用工具列表
   * @returns 工具相似度结果
   */
  async getToolMatches(input: string, tools: Tool[]): Promise<Array<{name: string, confidence: number}>> {
    // 此处应集成实际的相似度匹配算法
    // 简单示例实现
    const results = tools.map(tool => {
      const nameMatch = input.includes(tool.name) ? 0.8 : 0.1;
      const descMatch = input.includes(tool.description) ? 0.6 : 0.1;
      return {
        name: tool.name,
        confidence: Math.max(nameMatch, descMatch)
      };
    });
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 检查是否为继续流程的意图
   * @param input 用户输入
   * @param context 上下文
   * @param currentState 当前状态
   * @returns 意图结果或null
   */
  private async _checkContinueFlow(
    input: string,
    context: Message[],
    currentState: AgentState
  ): Promise<IntentResult | null> {
    if (!currentState.startsWith('waiting_for_')) {
      return null;
    }
    
    const paramName = currentState.split('waiting_for_')[1];
    
    // 基础实现：将用户输入作为参数值
    // 实际应用中，应当进行语义分析，提取相关参数
    return {
      intent: 'continue_flow',
      parameters: { [paramName]: input.trim() },
      confidence: 0.9
    };
  }
} 