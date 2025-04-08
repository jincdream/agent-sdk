/**
 * PromptManager 测试文件
 */

import { PromptManager, PromptTemplate } from '../../core/PromptManager';

describe('PromptManager', () => {
  let promptManager: PromptManager;
  
  beforeEach(() => {
    promptManager = new PromptManager();
  });
  
  test('添加提示模板应正确存储', () => {
    const templateName = 'test_template';
    const templateContent = '这是一个测试模板';
    const description = '测试用模板';
    
    promptManager.addPromptTemplate(templateName, templateContent, description);
    
    const templateNames = promptManager.getTemplateNames();
    expect(templateNames).toContain(templateName);
  });
  
  test('批量添加提示模板应正确存储', () => {
    const templates: PromptTemplate[] = [
      { name: 'template1', template: '模板1内容' },
      { name: 'template2', template: '模板2内容', description: '模板2描述' }
    ];
    
    promptManager.addPromptTemplates(templates);
    
    const templateNames = promptManager.getTemplateNames();
    expect(templateNames).toContain('template1');
    expect(templateNames).toContain('template2');
  });
  
  test('加载提示模板应返回正确内容', () => {
    const templateName = 'test_template';
    const templateContent = '这是一个测试模板';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const loadedTemplate = promptManager.loadPrompt(templateName);
    expect(loadedTemplate).toBe(templateContent);
  });
  
  test('加载不存在的提示模板应抛出错误', () => {
    expect(() => {
      promptManager.loadPrompt('non_existent_template');
    }).toThrow('提示模板 "non_existent_template" 不存在');
  });
  
  test('加载提示模板并替换变量应正确渲染', () => {
    const templateName = 'greeting';
    const templateContent = '你好，{{name}}！你的年龄是{{age}}岁。';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      name: '张三',
      age: 25
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe('你好，张三！你的年龄是25岁。');
  });
  
  test('加载提示模板并替换嵌套变量应正确渲染', () => {
    const templateName = 'user_info';
    const templateContent = '用户信息：{{user.name}}，角色：{{user.role}}';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      user: {
        name: '李四',
        role: '管理员'
      }
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe('用户信息：李四，角色：管理员');
  });
  
  test('加载提示模板时未提供的变量应保留占位符', () => {
    const templateName = 'incomplete';
    const templateContent = '姓名：{{name}}，年龄：{{age}}，职业：{{job}}';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      name: '王五',
      age: 30
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe('姓名：王五，年龄：30，职业：{{job}}');
  });
  
  test('获取模板名称应返回所有注册的模板名称', () => {
    promptManager.addPromptTemplate('template1', '内容1');
    promptManager.addPromptTemplate('template2', '内容2');
    
    const templateNames = promptManager.getTemplateNames();
    
    expect(templateNames.length).toBe(2);
    expect(templateNames).toContain('template1');
    expect(templateNames).toContain('template2');
  });
  
  test('删除提示模板应正确移除', () => {
    promptManager.addPromptTemplate('test_template', '测试内容');
    
    promptManager.removeTemplate('test_template');
    
    const templateNames = promptManager.getTemplateNames();
    expect(templateNames).not.toContain('test_template');
  });
  
  test('渲染包含对象变量的模板应正确转换为JSON字符串', () => {
    const templateName = 'object_template';
    const templateContent = '数据：{{data}}';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      data: { id: 1, name: '测试', tags: ['tag1', 'tag2'] }
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe(`数据：${JSON.stringify(variables.data)}`);
  });
  
  test('获取嵌套对象中不存在的值应返回undefined', () => {
    const templateName = 'nested_missing';
    const templateContent = '用户：{{user.profile.name}}';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      user: {
        // 没有 profile 属性
      }
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe('用户：{{user.profile.name}}');
  });
  
  test('获取嵌套对象中中间值为null的值应返回undefined', () => {
    const templateName = 'nested_null';
    const templateContent = '用户：{{user.profile.name}}';
    
    promptManager.addPromptTemplate(templateName, templateContent);
    
    const variables = {
      user: {
        profile: null
      }
    };
    
    const renderedTemplate = promptManager.loadPrompt(templateName, variables);
    expect(renderedTemplate).toBe('用户：{{user.profile.name}}');
  });
}); 