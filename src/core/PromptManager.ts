/**
 * 提示管理
 * 负责管理和加载提示模板
 */

export interface PromptTemplate {
  name: string;
  template: string;
  description?: string;
}

export class PromptManager {
  private prompts: Map<string, PromptTemplate> = new Map();
  
  /**
   * 添加提示模板
   * @param name 模板名称
   * @param template 模板内容
   * @param description 模板描述（可选）
   */
  addPromptTemplate(name: string, template: string, description?: string): void {
    this.prompts.set(name, { name, template, description });
  }
  
  /**
   * 批量添加提示模板
   * @param templates 模板数组
   */
  addPromptTemplates(templates: PromptTemplate[]): void {
    for (const template of templates) {
      this.prompts.set(template.name, template);
    }
  }
  
  /**
   * 加载提示模板
   * @param templateName 模板名称
   * @param variables 变量对象（可选）
   * @returns 填充变量后的模板内容
   */
  loadPrompt(templateName: string, variables?: Record<string, any>): string {
    const template = this.prompts.get(templateName);
    
    if (!template) {
      throw new Error(`提示模板 "${templateName}" 不存在`);
    }
    
    if (!variables) {
      return template.template;
    }
    
    return this._renderTemplate(template.template, variables);
  }
  
  /**
   * 获取所有模板名称
   * @returns 模板名称数组
   */
  getTemplateNames(): string[] {
    return Array.from(this.prompts.keys());
  }
  
  /**
   * 删除提示模板
   * @param templateName 模板名称
   */
  removeTemplate(templateName: string): void {
    this.prompts.delete(templateName);
  }
  
  /**
   * 渲染模板（替换变量）
   * @param template 模板字符串
   * @param variables 变量对象
   * @returns 替换变量后的字符串
   */
  private _renderTemplate(template: string, variables: Record<string, any>): string {
    // 使用简单的变量替换实现
    // 变量格式: {{variable}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this._getNestedValue(variables, key.trim());
      
      if (value === undefined) {
        // 保留未替换的变量占位符
        return match;
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    });
  }
  
  /**
   * 获取嵌套对象中的值
   * @param obj 对象
   * @param path 属性路径（如 'a.b.c'）
   * @returns 属性值或undefined
   */
  private _getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined;
      }
      
      result = result[key];
    }
    
    return result;
  }
} 