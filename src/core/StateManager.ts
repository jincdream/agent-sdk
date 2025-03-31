/**
 * 状态管理
 * 负责管理Agent的运行状态
 */

export type AgentState = 
  | 'idle' 
  | 'awaiting_user_input' 
  | 'executing_tool'
  | `waiting_for_${string}`;

export class StateManager {
  private currentState: AgentState = 'idle';
  private interruptedTool: string | null = null;
  
  /**
   * 设置当前状态
   * @param newState 新状态
   */
  setState(newState: AgentState): void {
    this.currentState = newState;
  }
  
  /**
   * 获取当前状态
   * @returns 当前状态
   */
  getState(): AgentState {
    return this.currentState;
  }
  
  /**
   * 设置中断的工具
   * @param toolName 工具名称
   */
  setInterruptedTool(toolName: string): void {
    this.interruptedTool = toolName;
  }
  
  /**
   * 获取中断的工具名称
   * @returns 工具名称
   */
  getInterruptedTool(): string | null {
    return this.interruptedTool;
  }
  
  /**
   * 获取当前等待的参数名称
   * @returns 参数名称或null
   */
  getExpectedParam(): string | null {
    if (this.currentState.startsWith('waiting_for_')) {
      return this.currentState.split('waiting_for_')[1];
    }
    return null;
  }
  
  /**
   * 重置状态
   */
  resetState(): void {
    this.currentState = 'idle';
    this.interruptedTool = null;
  }
} 