/*
 * @Date: 2021-03-13 08:24:59
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 17:00:28
 */
import InspectorConstructor from '.';
import { IConfig, IErrorThrowFunc, IValidatorConstructor } from '../typings';
import $Array from './validators/array';
import $Intersect from './validators/intersect';
import $Object from './validators/object';
import $Union from './validators/union';

export default class ValidatorConstructor<U> implements IValidatorConstructor {
  public Inspector: typeof InspectorConstructor;
  public $Array = $Array;
  public $Object = $Object;
  public $Union = $Union;
  public $Intersect = $Intersect;
  public throw: IErrorThrowFunc;
  public config: IConfig<U>;
  constructor(Inspector: typeof InspectorConstructor, throwFunc: IErrorThrowFunc, config: IConfig<U>) {
    this.Inspector = Inspector;
    this.throw = throwFunc;
    this.config = config;
  }
}