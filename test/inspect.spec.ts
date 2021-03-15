/*
 * @Date: 2020-11-02 10:09:36
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-15 17:01:07
 */
import expect from 'expect.js';
import Inspector from '../src/index';
import { IValidatorConstructor } from '../typings';

// js 测试源文件
describe('inspector.inspect', () => {
  it('类型验证', async () => {
    let sp = new Inspector();
    try {
      await sp.inspect('abc', Number);
    } catch (e) {
      expect(e.message).to.equal('·类型必须为数字，当前类型为字符串');
    }
    try {
      await sp.inspect(undefined, { required: true });
    } catch (e) {
      expect(e.message).to.equal('·为必填参数');
    }
    
    sp = new Inspector();
    let res = await sp.inspect(true, Boolean);
    expect(res.code).to.equal('ok');
    res = await sp.inspect({}, Object);
    expect(res.code).to.equal('ok');
    res = await sp.inspect(true, Boolean);
    expect(res.code).to.equal('ok');
    res = await sp.inspect({}, Object);
    expect(res.code).to.equal('ok');
    res = await sp.inspect({}, Number);
    expect(res.code).to.equal('fail');
  });

  it('正则表达式验证', async () => {
    let sp = new Inspector();
    let res = await sp.inspect('abc', /^abc/);
    expect(res.code).to.equal('ok');
    res = await sp.inspect(1234342, /4342$/);
    expect(res.code).to.equal('ok');
  });

  it('自定义验证器验证', async () => {
    let sp = new Inspector(config => {
      config.errors.notMatchAbc = (value, _, key, extra) => `${extra}不匹配\`abc\`，它的值为${value}，key为${key || '-'}`;
    });
    function validator(this: IValidatorConstructor, value: any) {
      if (value === 'abc') {
        this.throw.notMatchAbc('当前值');
      }
      else if (value === 'def') {
        this.throw('自定义错误，值为：' + value);
      }
    }
    let res = await sp.inspect('abc', validator);
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·当前值不匹配`abc`，它的值为abc，key为-');
    res = await sp.inspect('def', validator);
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·自定义错误，值为：def');
    res = await sp.inspect('gh', validator);
    expect(res.code).to.equal('ok');
  });

  it('异步验证', async () => {
    let sp = new Inspector();
    let res = await sp.inspect('abc', async function(this: IValidatorConstructor) {
      await new Promise(resolve => setTimeout(resolve, 500));
      this.throw.falsy();
    });
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·为必填参数');
  });
  
  it('详细验证规则', async () => {
    let sp = new Inspector();
    let res = await sp.inspect('1320394882', { label: '手机号', validator: /^1[0-9]{10}/ });
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·手机号值1320394882与正则表达式/^1[0-9]{10}/不匹配');
    res = await sp.inspect('13203948827', { label: '手机号', validator: /^1[0-9]{10}/ });
    expect(res.code).to.equal('ok');
  });
});