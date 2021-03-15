/*
 * @Date: 2019-11-29 18:10:42
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:44:18
 */
import { TFinalRule, TFuncValidator } from '../../typings';

// 交叉类型，相当于 && 操作符
export default function $Intersect(...validators: TFinalRule[]) {
  return async function(value) {
    let scopedInspector = new this.Inspector(() => {
      return {
        ...this.config,
        transformError: errors => errors.map(({ error }) => error).join(';'),
        throwError: false,
      };
    });
    for (let validator of validators) {
      let errMsg = (await scopedInspector.inspect(value, validator)).error;
      if (errMsg) {
        this.throw(errMsg);
      }
    }
  } as TFuncValidator;
}