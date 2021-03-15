/*
 * @Date: 2019-11-29 21:44:49
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:44:11
 */
import { IDetailedRule, TErrorConverter, TFinalRule, TFuncValidator } from '../../typings';
import { getConstructor } from '../helper';

type TFinalRules = {[attr: string]: TFinalRule};
// 用于检查数组内包含值的检查员
export default function $Array(validator: TFinalRule|TFinalRules) {
  return async function(value) {
    if (!Array.isArray(value)) {
      this.throw.notArray();
    }
    
    let scopedInspector = new this.Inspector(() => {
      return {
        ...this.config,
        throwError: false,
        transformError: errors => errors.map(({ error }) => error).join(';'),
      };
    });
    for (let i in value) {
      const valItem = value[i];
      let errMsg = '';
      if (getConstructor(validator) === Object) {
        errMsg = (await scopedInspector.batchInspect(valItem, validator as TFinalRules)).error;
      }
      else {
        errMsg = (await scopedInspector.inspect(valItem, validator)).error;
      }
      if (errMsg) {
        this.throw.arrayError({ index: i, errMsg });
      }
    }
  } as TFuncValidator;
}
export const arrayErrorReports = {
  notArray: ((_, rule, key) => `${(rule as IDetailedRule).label || key}不是数组`) as TErrorConverter,
  arrayError: ((_, rule, key, { index, errMsg }: { index: number, errMsg: string }) => {
    return `数组${(rule as IDetailedRule).label || key}下标\`${index}\`的值验证失败:${errMsg}`;
  }) as TErrorConverter,
};