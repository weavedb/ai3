import { clone, isNil, map, is, mapObjIndexed, mergeLeft } from "ramda"
import Token from "./plugins/token.js"
import VC from "./plugins/vc.js"
import DEX from "./plugins/dex.js"

const f = () => ({})

export const get = (o = {}, s = {}, p = {}) => {
  const g = v3 => {
    const n = is(Function, o[v3]?.val) ? o[v3].val(g, s, p) : o[v3]?.val
    return isNil(n) || Number.isNaN(n) ? null : n
  }
  return g
}
let __plugins = { token: Token, vc: VC, dex: DEX }

const cloneP = (s, p) => {
  for (const k in p ?? {}) {
    s[k] = {}
    for (const k2 in p[k].v) if (!is(Object, p[k].v[k2])) s[k][k2] = p[k].v[k2]
  }
}
export class AI3 {
  constructor({ vars = {}, plugins = {} } = {}) {
    this.vars = vars
    let r = {}
    for (const k in vars.__plugins__ ?? {}) r[k] = {}
    const g = get(this.vars, r)
    this.get = g
    const _plugins = mergeLeft(plugins, __plugins)
    this.p = {}
    for (const k in vars.__plugins__ ?? {}) {
      const o = vars.__plugins__[k]
      this.p[k] = new _plugins[o.type]({ o, g, v: this.vars, k })
    }
  }
  calc(r = {}) {
    const _g = get(this.vars, r)
    let _v = {}
    for (let k in this.vars) _v[k] = _g(k)
    return _v
  }
  simulate({ years = 3, before = f, after = f, players = [] } = {}) {
    let _r = {}
    for (const k in this.vars.__plugins__ ?? {}) _r[k] = {}
    let v = this.calc(_r)
    let s = []
    let p = map(v => v.init(), this.p)
    const g = get(this.vars, _r)
    for (const k in p) {
      if (is(Function, p[k].init)) p[k].init({ g })
    }
    s.push({ i: 0 })
    cloneP(s[0], p)
    let r = mergeLeft(before({ years, v, s, p, i: 0 }), { i: 0 })
    s[0] = mergeLeft(s[0], r)
    const copy = obj => {
      if (is(Object, obj)) {
        if (is(Array, obj)) {
          let obj2 = []
          for (const v of obj) obj2.push(copy(v))
          return obj2
        } else {
          let obj2 = {}
          for (const k in obj) obj2[k] = copy(obj[k])
          return obj2
        }
      } else {
        return obj
      }
    }
    for (let i = 0; i < 365 * years; i++) {
      r.i = i + 1
      s[i + 1] = { i: i + 1 }
      for (let p2 of players) p2.fn({ v, s, i: i + 1, years, r, p })
      s[i + 1] = mergeLeft(s[i + 1], r)
      cloneP(s[i + 1], p)
    }
    after({ years, v, s, r, p })
    for (const k in p) if (p[k].v) r[k] = p[k].v
    this.get = get(this.vars, r)
    let nvars = mapObjIndexed((v, k) => this.get(k))(this.vars)
    return { res: r, stats: s, nvars }
  }
}
