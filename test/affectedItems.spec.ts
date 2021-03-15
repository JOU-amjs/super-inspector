/*
 * @Date: 2021-03-12 17:43:24
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-14 19:49:57
 */
import expect from 'expect.js';
import Inspector from '../src/index';
import { IValidatorConstructor } from '../typings';

describe('inspector.affectedItems', () => {
  it('导出影响项', async () => {
    let sp = new Inspector();
    let affectedItems = await sp.affectedItems({ a: undefined, b: 'abc', c: 123 }, {
      a: {
        label: '标签1',
        validator: String,
        deps: { b: /abd/ }
      },
      b: /abc$/,
      c: {
        validator: String,
        deps: { b: /^abc$/ }
      },
    });
    expect(affectedItems.a).to.equal(false);
    expect(affectedItems.b).to.equal(true);
    expect(affectedItems.c).to.equal(true);
  });

  it('异步匹配导出影响项', async () => {
    let sp = new Inspector();
    let affectedItems = await sp.affectedItems({ a: undefined, b: 'abc', c: 123 }, {
      a: {
        label: '标签1',
        validator: String,
        deps: {
          b: async function(this: IValidatorConstructor) {
            await new Promise(resolve => setTimeout(resolve, 300));
            this.throw.falsy();
          }
        }
      },
      b: /abc$/,
      c: {
        validator: String,
        deps: {
          b: async function(this: IValidatorConstructor) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      },
    });
    expect(affectedItems.a).to.equal(false);
    expect(affectedItems.b).to.equal(true);
    expect(affectedItems.c).to.equal(true);
  });
});