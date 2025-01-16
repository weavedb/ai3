import { is, mapObjIndexed, mergeLeft } from "ramda"

const f = () => ({})

export const get = (o = {}, s = {}) => {
  const g = v3 => (is(Function, o[v3]?.val) ? o[v3].val(g, s) : o[v3]?.val)
  return g
}

export class AI3 {
  constructor({ vars = {} } = {}) {
    this.vars = vars
  }
  calc(s = {}) {
    const _g = get(this.vars, s)
    let _v = {}
    for (let k in this.vars) _v[k] = _g(k)
    return _v
  }
  simulate({ years = 3, before = f, after = f, players = [] } = {}) {
    let v = this.calc()
    let s = []
    let r = mergeLeft(before({ years, v, s }), { i: 0 })
    s[0] = mergeLeft(s[0], r)
    for (let i = 0; i < 365 * years; i++) {
      r.i = i + 1
      s[i + 1] = { i: i + 1 }
      for (let p of players) {
        p.fn({ v, s, i: i + 1, years, r })
      }
      s[i + 1] = mergeLeft(s[i + 1], r)
    }
    after({ years, v, s, r })
    this.get = get(this.vars, r)
    let nvars = mapObjIndexed((v, k) => this.get(k))(this.vars)
    return { res: r, stats: s, nvars }
  }
}
