/*
 * @Date: 2019-11-29 21:44:49
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 19:48:46
 */
import InspectorConstructor from '.';
import { IDetailedRule, TBaseData, TFinalRule, TFuncValidator } from '../typings';
import { createErrorThrower, errorPrefix, runtimeError } from './errors';
import { getConstructor, getRuleValidator } from './helper';
import ValidatorConstructor from './validatorConstructor';
const variableTypes = [String, Number, Function, Boolean, Object, Symbol];

// 基础检查员，可检查一个值的类型、正则表达式匹配、以及验证函数等
// 其他检查员都需要依赖此检查员
export async function BaseInspector<T, U>(ctx: InspectorConstructor<T, U>, Inspector: typeof InspectorConstructor, value: any, rule: TFinalRule, key: string|undefined, depValue?: any) {
  // required默认为true
  let required = (rule as IDetailedRule).required;
  required = required === undefined ? true : required;
  let { validator, errorOverride } = getRuleValidator(rule);
  if (!required && !validator) {
    runtimeError('required为false时，必须定义validator验证器');
  }
  
  // 构造错误抛出函数
  let throwError: any = (message: string) => {
    throw new Error(errorPrefix + message);
  };
  Object.keys(ctx.config.errors).forEach(errName => {
    throwError[errName] = createErrorThrower(ctx.config.errors[errName], rule, key || '', value, depValue);
  });
  const validatorConstructor = new ValidatorConstructor<U>(Inspector, throwError, ctx.config);
  try {
    if (required && ctx.config.falsyValues.includes(value)) {
      // 如果是要求的但没有值则报错
      throwError.falsy();
    }
    else if (value !== undefined && value !== null) {
      if (variableTypes.indexOf(validator as TBaseData) >= 0 && getConstructor(value) !== validator) {
        // 类型验证失败
        throwError.type();
      }
      if (validator instanceof RegExp && !validator.test(value)) {
        // 正则表达式验证失败
        throwError.regexp();
      }
      if (typeof validator === 'function') {
        // 验证方法调用
        await (validator as TFuncValidator).call(validatorConstructor, value, rule, key, depValue);
      }
    }
  } catch (e) {
    let errorMsg = e.message as string;
    if (errorMsg.indexOf(errorPrefix) === 0) {
      // 如果有覆盖的错误信息则优先使用该信息
      return errorOverride ? 
        (typeof errorOverride === 'function' ? errorOverride(value, rule, key, undefined, depValue) : errorOverride)
      : errorMsg.replace(errorPrefix, '');
    }
    
    // 如果是校验器内部语法的错误则直接抛出
    throw e;
  }
}