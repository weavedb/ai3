import {
  of,
  compose,
  flatten,
  xprod,
  range,
  clone,
  isNil,
  map,
  is,
  mapObjIndexed,
  mergeLeft,
} from "ramda"
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
    this.plugins = mergeLeft(plugins, __plugins)
    const { g, p } = this.init({ vars })
    this.get = g
  }
  init({ vars }) {
    let r = {}
    for (const k in vars.__plugins__ ?? {}) r[k] = {}
    const g = get(vars, r)
    let p = {}
    for (const k in vars.__plugins__ ?? {}) {
      const o = vars.__plugins__[k]
      p[k] = new this.plugins[o.type]({ o, g, v: vars, k })
    }
    return { g, p, r }
  }
  calc(r = {}, vars = this.vars) {
    const _g = get(vars, r)
    let _v = {}
    for (let k in vars) _v[k] = _g(k)
    return _v
  }
  simulate({
    years = 3,
    before = f,
    after = f,
    players = [],
    vars = this.vars,
    reinit = false,
  } = {}) {
    let s = []
    let { p: _p, g, r: _r } = this.init({ vars })
    let v = this.calc(_r, vars)
    let p = map(v => v.init(), _p)
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
    this.get = get(vars, r)
    let nvars = mapObjIndexed((v, k) => this.get(k))(vars)
    return { res: r, stats: s, nvars }
  }
  fuzz({ fuzz, find, before, after, players, years = 1 }) {
    let cases = []
    let fields = []
    let results = {}
    for (const k in find) results[k] = null
    for (const k in cases) {
      fields.push(k)
      const r = cases[k].range
      const _r = range(r[0], r[1])
      if (cases.length === 0) cases = map(of(Array))(_r)
      else cases = compose(map(flatten), xprod(cases))(_r)
    }
    let max = null
    let i = 0
    for (const c of cases) {
      let vars = clone(this.vars)
      let i2 = 0
      for (const v of c) vars[fields[i2++]].val = v
      const { nvars, res, stats } = this.simulate({
        before,
        after,
        players,
        years,
        vars,
      })
      for (const k in results) {
        let r = results[k]
        let update = !r
        if (!update) {
          if (find[k] === "max") update = r.vals[k] < nvars[k]
          else if (find[k] === "min") update = r.vals[k] > nvars[k]
          else if (is(Function(find[k].fn))) {
            update = find[k]({ current: r[k], val: nvars[k], nvars, res })
          }
        }
        if (update) {
          results[k] = { case: {}, vals: { [k]: nvars[k] }, res, nvars }
          let i3 = 0
          for (const v of fields) results[k].case[v] = c[i3++]
        }
      }
      i++
    }
    return results
  }
}
