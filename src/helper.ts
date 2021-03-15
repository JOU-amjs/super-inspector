/*
 * @Date: 2020-11-03 11:46:24
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-12 23:38:45
 */

import { IDetailedRule, TFinalRule } from '../typings';

/**
 * @description: 获取验证规则的验证器
 * @author: JOU(wx: huzhen555)
 * @param {TFinalRule} ruleDetail
 * @return {object} 验证器
 */
export function getRuleValidator(rule: TFinalRule) {
  return {
    // 支持字面量的对象和Object.create(null)的对象
    validator: rule.constructor === Object || rule.constructor === undefined ? 
    (rule as IDetailedRule).validator : rule,
    errorOverride: (rule as IDetailedRule).error,
  };
}

/**
 * @description: 获取值的构造函数，如果值为undefined或null则返回本身
 * @author: JOU(wx: huzhen555)
 * @param {any} value
 * @return {any} 值的构造器，如果值为undefined或null则返回本身
 */
export function getConstructor(value: any) {
  return value !== undefined && value !== null ? value.constructor : value;
}