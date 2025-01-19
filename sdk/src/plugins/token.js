import { Simulator, Plugin } from "./plugin.js"
import { is } from "ramda"

class Sim extends Simulator {
  constructor({ p }) {
    super({ p })
  }
  init({ g }) {}
}

export default class Token extends Plugin {
  constructor({ o, g, v, k }) {
    super({ o, g, k, v, Sim })
    const its = this.key("its")
    const price = this.key("p")
    const ts = this.key("ts")
    const fdv = this.key("fdv")
    const token = `$${o.ticker.toUpperCase()}`

    this.v = { price: 0 }
    this.var(
      its,
      {
        name: `${token} Initial Total Supply`,
        val: o.supply,
        type: o.ticker.toUpperCase(),
      },
      "ts",
    )
    this.var(price, {
      name: `${token} Price`,
      val: (v, r) => r[k]?.price,
      calc: o.price_calc ?? "-",
    })
    this.var(ts, {
      name: `${token} Total Supply`,
      val: (v, r) => r[k]?.ts,
      calc: o.ts_calc ?? "-",
      type: o.ticker.toUpperCase(),
    })
    this.var(fdv, {
      name: `${token} FDV`,
      val: g => g(ts) * g(price),
      decimal: 0,
      calc: `${ts} * ${price}`,
    })
  }
}
