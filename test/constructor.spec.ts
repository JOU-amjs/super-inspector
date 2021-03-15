/*
 * @Date: 2021-03-13 11:33:15
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:55:18
 */
import expect from 'expect.js';
import Inspector from '../src/index';

describe('inspector.constructor', () => {
  it('错误转换器检验', () => {
    expect(() => {
      new Inspector(config => {
        config.errors.customerError = 12334 as any;
      });
    }).to.throwError();
  });
  
  it('校验时返回非字符串错误', async () => {
    let sp = new Inspector<true, string[]>(config => {
      config.transformError = errors => errors.map(({ error }) => error);
    });
    let res = await sp.batchInspect({ a: 1, b: 2 }, {
      a: String,
      b: String,
    });
    expect(res.error.length).to.equal(2);
  });
});