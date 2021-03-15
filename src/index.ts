/*
 * @Date: 2019-11-29 21:44:49
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-14 19:48:27
 */

import { IConfig, IDetailedRule, IInspectRes, TFinalRule, TRawError } from '../typings';
import { BaseInspector } from './base';
import { defaultErrors, runtimeError } from './errors';

export { default as $Array } from './validators/array';
export { default as $Object } from './validators/object';
export { default as $Union } from './validators/union';
export { default as $Intersect } from './validators/intersect';

// /** @params {object} superInspector 超级检查员，用于对象变量值验证，支持分组验证 */
// const rules = {
//   value1: Number,
//   value2: { name: '值2', validator: /abc/, required: false }, // required默认为true
//   value3: { name: '值3', validator: val => val === 'abc', required: false },
//   value4: $Array(String),
//   value5: { name: '值5', validator: /123/, deps: [{ key: 'value1', match: /abc/ }], }
//   value6: { name: '值6', validator: [/555/,  '{name}的值必须包含555'], },
// }

/**
 * @description: 根据实际验证值和验证规则，返回有效数据，即需要参与验证的项
 * @author: JOU(wx: huzhen555)
 * @param {any} data 校验的数据
 * @param {TFinalRule} rules 校验规则
 * @return 有效参数集合
 */
 async function affectedExector<T, U>(ctx: InspectorConstructor<T, U>, data: {[key: string]: any}, rules: {[attr: string]: TFinalRule}) {
  let affecteds: {[key: string]: boolean} = {};
  let depKeys: {[key: string]: string} = {};
  rules = rules || {};
  for (let key in rules) {
    const ruleItem = rules[key];
    let deps = (ruleItem as IDetailedRule).deps;
    affecteds[key] = true;
    if (deps) {
      affecteds[key] = Object.keys(deps).length <= 0;
      for (let depKey in deps) {
        let depRule = deps[depKey];
        // 注意：BaseInspector有error返回值表示验证不通过，没有返回值则表示验证通过
        // 只要一项验证通过则认为需要验证这个值
        let error = await BaseInspector(ctx, InspectorConstructor, data[depKey], depRule, depKey);
        if (!error) {
          depKeys.depKey = depKey;
          affecteds[key] = true;
          break;
        }
      }
    }
  }
  return { affecteds, depKeys };
}

const errorAry2Str = (errors: TRawError[]) => errors.map(({ error }) => `·${error}`).join('\n');
//////////////////////////////
//////////////////////////////
//////// Core Class //////////
//////////////////////////////
//////////////////////////////
export default class InspectorConstructor<T = true, U = string> {
  public config: IConfig<U>;
  constructor(configExecutor?: (config: IConfig<U>) => IConfig<U>|void) {
    // 必须在构造函数中浅拷贝默认错误对象，否则会造成多个创建对象中的config.errors相互影响
    this.config = {
      errors: { ...defaultErrors },
      falsyValues: [null, undefined, NaN],
      throwError: false,
    };
    if (typeof configExecutor === 'function') {
      this.config = configExecutor(this.config) || this.config;
    }
    
    // 初始化统一的错误抛出函数
    let errors = this.config.errors || {};
    Object.keys(errors).forEach(errorName => {
      let errorHandler = errors[errorName];
      let errorType = typeof errorHandler;
      if (errorType !== 'function' && errorType !== 'string') {
        runtimeError('模板必须为string或function');
      }
    });
  }

  /**
   * @description: 校验单个值
   * @author: JOU(wx: huzhen555)
   * @param {any} data 校验的数据
   * @param {TFinalRule} rules 校验规则
   * @param {boolean} forceReturn 当该对象的config.throwError=true时，也强制返回错误
   * @return {IInspectRes} throwError为true时抛出错误，否则返回校验结果
   */
  async inspect(data: any, rule: TFinalRule): Promise<T extends true ? IInspectRes<U> : void> {
    let error: any = (await BaseInspector<T, U>(this, InspectorConstructor, data, rule, undefined)) || null;
    let code = error ? 'fail' : 'ok';
    error = error ? (this.config.transformError || errorAry2Str)([{key: '', error}]) : error;
    if (code === 'fail' && this.config.throwError) {
      throw new Error(error);
    }
    return {
      code,
      error,
    } as T extends true ? IInspectRes<U> : void;
  }
  
  /**
   * @description: 批量校验值，批量校验时支持联合校验
   * @author: JOU(wx: huzhen555)
   * @param {any} data 校验的数据
   * @param {any} rules 校验规则
   * @return {IInspectRes} throwError为true时抛出错误，否则返回校验结果
   */
  async batchInspect(data: {[key: string]: any}, rules: {[attr: string]: TFinalRule}): Promise<T extends true ? IInspectRes<U> : void> {
    let errors: TRawError[] = [];
    const { affecteds, depKeys } = await affectedExector<T, U>(this, data, rules);
    rules = rules || {};
    for (let key in rules) {
      const ruleItem = rules[key];
      // effective为true表示需要验证该值
      if (affecteds[key]) {
        let depValue = depKeys[key] ? data[depKeys[key]] : undefined;
        let error = await BaseInspector<T, U>(this, InspectorConstructor, data[key], ruleItem, key, depValue);
        if (error) {
          errors.push({ key, error });
        }
      }
    }

    let code = errors.length > 0 ? 'fail' : 'ok';
    let error: any = code === 'fail' ? (this.config.transformError || errorAry2Str)(errors) : null;
    if (code === 'fail' && this.config.throwError) {
      throw new Error(error);
    }
    else {
      return {
        code,
        error,
      } as T extends true ? IInspectRes<U> : void;
    }
  }

  /**
   * @description: 根据实际验证值和验证规则，返回有效数据，即需要参与验证的项
   * @author: JOU(wx: huzhen555)
   * @param {any} data 校验的数据
   * @param {TFinalRule} rules 校验规则
   * @return 有效参数集合
   */
  async affectedItems(data: {[key: string]: any}, rules: {[attr: string]: TFinalRule}) {
    let { affecteds } = await affectedExector<T, U>(this, data, rules);
    return affecteds;
  }
}