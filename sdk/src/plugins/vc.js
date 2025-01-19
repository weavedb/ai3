import { Simulator, Plugin } from "./plugin.js"
import { mergeLeft } from "ramda"

class Sim extends Simulator {
  constructor({ p }) {
    super({ p })
  }
  init({ g }) {
    this.v.gain = 0
    this.v.dur = this.p.v.vp * 30
    this.v.sold = 0
    this.v.price = this.p.v.sp
    this.v.cliff = this.p.v.c * 30
    this.v.unlocked = 0
    this.v.rest = (this.p.v.p / 100) * g(`${this.v.t.toLowerCase()}_its`)
    this.v.rate = Math.floor(this.v.rest / this.v.dur)
  }
}

export default class VC extends Plugin {
  constructor({ o, v, k, g }) {
    super({ o, v, k, g, Sim })
    this.v = { t: o.token, r: o.round }
    this.var(
      this.key("p"),
      { name: `${this.v.r} %`, val: o.per, type: "%" },
      "p",
    )
    this.var(this.key("v"), { name: `${this.v.r} Valuation`, val: o.val }, "v")
    this.var(
      this.key("vp"),
      {
        name: `${this.v.r} Vesting Period`,
        val: o.vesting,
        type: "months",
      },
      "vp",
    )

    this.var(
      this.key("c"),
      {
        name: `${this.v.r} Vesting Cliff`,
        val: o.cliff,
        type: "months",
      },
      "c",
    )
    this.var(
      this.key("sp"),
      { name: `${this.v.r} Sell Price`, val: o.sell },
      "sp",
    )

    this.v = mergeLeft(
      {
        s: (this.v.p / 100) * this.v.v,
        tp: this.v.v / g(`${o.token.toLowerCase()}_its`),
      },
      this.v,
    )

    this.var(this.key("s"), {
      name: `${this.v.r} Sales`,
      calc: `${this.key("p")} / 100 * ${this.key("v")}`,
      val: v => (v(this.key("p")) / 100) * v(this.key("v")),
    })
    this.var(this.key("tp"), {
      name: `${this.v.r} Token Price`,
      val: v => v(this.key("v")) / v(`${this.v.t.toLowerCase()}_its`),
      calc: `${this.key("v")} / ${this.v.t.toLowerCase()}_its`,
    })
  }
}
