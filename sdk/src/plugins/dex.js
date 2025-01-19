import { mergeLeft } from "ramda"
import { Simulator, Plugin } from "./plugin.js"

class Sim extends Simulator {
  constructor({ p }) {
    super({ p })
  }
  _prices() {
    this.v.pa = this.v.lb / this.v.la
    this.v.pb = this.v.la / this.v.lb
  }
  sellA(amount) {
    const ob = this.v.lb
    this.v.la = this.v.la + amount
    this.v.lb = this.v.k / this.v.la
    this._prices()
    return this.v.lb - ob
  }
  sellB(amount) {
    const oa = this.v.la
    this.v.lb = this.v.lb + amount
    this.v.la = this.v.k / this.v.lb
    this._prices()
    return this.v.la - oa
  }
  buyA(amount) {
    const ob = this.v.lb
    this.v.la = this.v.la - amount
    this.v.lb = this.v.k / this.v.la
    this._prices()
    return this.v.lb - ob
  }
  buyB(amount) {
    const oa = this.v.la
    this.v.lb = this.v.lb - amount
    this.v.la = this.v.k / this.v.lb
    this._prices()
    return this.v.la - oa
  }
}

export default class DEX extends Plugin {
  constructor({ o, g, k, v }) {
    super({ o, g, k, v, Sim })
    this.v = {}

    this.var(
      this.key(`${this.o.tokenA}_il`),
      {
        name: `DEX $${this.o.tokenA} Initial Liquidity`,
        val: this.o.liquidityA,
        type: this.o.tokenA,
      },
      "la",
    )
    this.var(
      this.key(`${this.o.tokenB}_il`),
      {
        name: `DEX $${this.o.tokenB} Initial Liquidity`,
        val: this.o.liquidityB,
        type: this.o.tokenB,
      },
      "lb",
    )

    this.v = mergeLeft(
      {
        a: this.o.tokenA,
        b: this.o.tokenB,
        k: this.v.la * this.v.lb,
        pa: this.v.lb / this.v.la,
        pb: this.v.la / this.v.lb,
      },
      this.v,
    )

    this.var(this.key(`${this.o.tokenA}_l`), {
      name: `DEX $${this.o.tokenA} Liquidity`,
      val: (v, r) => r[k]?.la,
      type: this.o.tokenA,
      calc: "-",
    })

    this.var(this.key(`${this.o.tokenB}_l`), {
      name: `DEX $${this.o.tokenB} Liquidity`,
      val: (v, r) => r[k]?.lb,
      type: this.o.tokenB,
      calc: "-",
    })

    this.var(this.key(`k`), {
      name: `DEX K`,
      val: this.v.k,
      calc: `${this.key(`${this.o.tokenA}_il`)} * ${this.key(`${this.o.tokenB}_il`)}`,
      type: "",
    })
    this.var(this.key(`${this.o.tokenA}_ip`), {
      name: `DEX $${this.o.tokenA} Initial Price`,
      val: this.v.pa,
      type: this.o.tokenB,
    })
    this.var(this.key(`${this.o.tokenA}_p`), {
      name: `DEX $${this.o.tokenA} Price`,
      val: (v, r) => r[k]?.pa,
      type: this.o.tokenB,
    })
    this.var(this.key(`${this.o.tokenB}_ip`), {
      name: `DEX $${this.o.tokenB} Initial Price`,
      val: this.v.pb,
      type: this.o.tokenA,
    })
    this.var(this.key(`${this.o.tokenB}_p`), {
      name: `DEX $${this.o.tokenB} Price`,
      val: (v, r) => r[k]?.pb,
      type: this.o.tokenA,
    })
  }
}
