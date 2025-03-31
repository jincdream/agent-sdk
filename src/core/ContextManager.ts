/**
 * 上下文管理
 * 负责管理Agent与用户之间的消息记录
 */

export interface Message {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class ContextManager {
  private context: Message[] = [];
  private lastToolArgs: Record<string, any> = {};
  
  /**
   * 添加消息到上下文
   * @param message 消息对象
   */
  addMessage(message: Message): void {
    this.context.push(message);
  }
  
  /**
   * 获取上下文消息
   * @param maxTokens 可选，最大token数限制
   * @returns 上下文消息数组
   */
  getContext(maxTokens?: number): Message[] {
    if (!maxTokens) {
      return [...this.context];
    }
    
    // 简单实现基于消息数量的截断，实际应用中应该基于token计算
    const messagesToReturn = [...this.context];
    return messagesToReturn.slice(-maxTokens);
  }
  
  /**
   * 清空上下文
   */
  clearContext(): void {
    this.context = [];
  }
  
  /**
   * 保存工具调用参数
   * @param toolName 工具名称
   * @param args 工具参数
   */
  saveToolArgs(toolName: string, args: Record<string, any>): void {
    this.lastToolArgs = { ...args, _toolName: toolName };
  }
  
  /**
   * 获取最后一次工具调用的参数
   * @returns 工具参数对象
   */
  getLastToolArgs(): Record<string, any> {
    const { _toolName, ...args } = this.lastToolArgs;
    return args;
  }
  
  /**
   * 获取最后一次工具调用的名称
   * @returns 工具名称
   */
  getLastToolName(): string | null {
    return this.lastToolArgs._toolName || null;
  }
} 