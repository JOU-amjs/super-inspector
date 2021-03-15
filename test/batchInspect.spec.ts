/*
 * @Date: 2020-11-02 10:09:36
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-14 19:51:33
 */
import expect from 'expect.js';
import Inspector from '../src/index';
import { IDetailedRule, TFinalRule, IValidatorConstructor } from '../typings';

// js 测试源文件
describe('inspector.batchInspect', () => {
  it('批量验证', async () => {
    let sp = new Inspector(config => {
      config.transformError = errors => errors.map(({ error }) => error).join('\n');
    });
    let res = await sp.batchInspect({ a: 123, b: 'abc' }, {
      a: String,
      b: /abc$/,
    });
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('a类型必须为字符串，当前类型为数字');
    res = await sp.batchInspect({ a: undefined, b: 'abc' }, {
      a: { validator: String, required: false },
      b(this: IValidatorConstructor, value: any) {
        if (value === 'abc') {
          this.throw('抛出错误');
        }
      },
    });
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('抛出错误');
  });

  it('联合验证', async () => {
    let sp = new Inspector();
    let res = await sp.batchInspect({ a: undefined, b: 'abc', c: 123 }, {
      a: {
        validator: String,
        deps: {
          b: /abd/,
          c: /123/
        },
      },
      b: /abc$/,
      c: {
        validator: String,
        deps: { b: /^abc$/ }
      },
    });

    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·a为必填参数\n·c类型必须为字符串，当前类型为数字');
    sp = new Inspector(config => {
      config.transformError = errors => errors.map(({ error }) => error).join('.');
      config.errors.type = (_, rule) => `${(rule as IDetailedRule).label || ''}的类型与预期不符`;
    });

    await sp.batchInspect({ a: false, b: 'abc', c: 123 }, {
      a: { label: 'A', validator: String, deps: { b: /abc/ } },
      c: { label: 'C', validator: String, deps: { b: /^abc$/ } },
    }).catch(e => {
      let errors = e.message.split('.');
      expect(errors[0]).to.equal('A的类型与预期不符');
      expect(errors[1]).to.equal('C的类型与预期不符');
    });
  });

  it('自定义验证器依赖值', async () => {
    let sp = new Inspector();
    await sp.batchInspect({ a: undefined, b: 'abc', c: 123 }, {
      a: {
        validator(_: any, __: TFinalRule, ___?: string, depValue?: any) {
          expect(depValue).to.equal(123);
        },
        deps: {
          b: /abd/,
          c: /123/,
        }
      },
      b: /abc$/,
      c: Number,
    });
  });
  
  it('覆盖错误', async () => {
    let sp = new Inspector();
    let res = await sp.batchInspect({ a: 123, b: 'abc' }, {
      a: {
        validator(this: IValidatorConstructor, value: any, rule: TFinalRule, key?: string): void {
          expect(value).to.equal(123);
          expect((rule as IDetailedRule).error).to.equal('不是数字');
          expect(key).to.equal('a');
          this.throw('抛出函数错误');
        },
        error: '不是数字',
      },
      b: {
        validator: Object,
        error: () => '非对象类型',
      },
    });
    expect(res.code).to.equal('fail');
    let errors = res.error.split('\n');
    expect(errors[0]).to.equal('·不是数字');
    expect(errors[1]).to.equal('·非对象类型');
  });
});