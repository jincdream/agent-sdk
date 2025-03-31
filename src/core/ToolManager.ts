/**
 * 工具管理
 * 负责管理和执行Agent工具
 */

// JSON Schema 类型定义
export type JSONSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface JSONSchema {
  type: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  enum?: any[];
  [key: string]: any;
}

// 工具接口定义
export interface Tool {
  name: string;
  description: string;
  parameters?: JSONSchema;
  execute: (args: any) => Promise<string>;
}

export interface ExecuteResult {
  success: boolean;
  result: string;
  error?: string;
  missingParams?: string[];
}

export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  
  /**
   * 注册工具
   * @param tool 工具对象
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  /**
   * 注销工具
   * @param toolName 工具名称
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
  }
  
  /**
   * 执行工具
   * @param name 工具名称
   * @param args 参数对象
   * @returns 执行结果
   */
  async executeTool(name: string, args: any): Promise<ExecuteResult> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        success: false,
        result: '',
        error: `工具 ${name} 不存在`
      };
    }
    
    // 参数验证
    if (tool.parameters) {
      const missingParams = this._validateParams(tool.parameters, args);
      if (missingParams.length > 0) {
        return {
          success: false,
          result: '',
          error: '缺少必要参数',
          missingParams
        };
      }
    }
    
    try {
      const result = await tool.execute(args);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 获取工具模式定义
   * @param name 工具名称
   * @returns JSON Schema定义或undefined
   */
  getToolSchema(name: string): JSONSchema | undefined {
    const tool = this.tools.get(name);
    return tool?.parameters;
  }
  
  /**
   * 获取所有注册的工具
   * @returns 工具数组
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * 验证参数是否符合Schema要求
   * @param schema JSON Schema
   * @param args 参数对象
   * @returns 缺失参数数组
   */
  private _validateParams(schema: JSONSchema, args: any): string[] {
    const missingParams: string[] = [];
    
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredParam of schema.required) {
        if (args[requiredParam] === undefined) {
          missingParams.push(requiredParam);
        }
      }
    }
    
    return missingParams;
  }
} 