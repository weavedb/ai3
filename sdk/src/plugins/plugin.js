import { is, clone } from "ramda"

export class Simulator {
  constructor({ p }) {
    this.p = p
    this.v = clone(p.v)
  }
}

export class Plugin {
  constructor({ o = {}, g, k, v, Sim = Simulator }) {
    this.simulator = Sim
    this.o = {}
    this.k = k
    this.gvars = v
    this.vars = {}
    for (const k in o) this.o[k] = is(Function, o[k]) ? o[k](g, this.o) : o[k]
  }
  var(key, val, to) {
    if (!this.gvars[key]) {
      this.gvars[key] = val
    }
    this.vars[key] = this.gvars[key]
    if (to) this.v[to] = this.vars[key].val
  }
  key(name) {
    return `${this.k.toUpperCase()}_${name}`.toLowerCase()
  }
  init() {
    return new this.simulator({ p: this })
  }
}
