import { Simulator, Plugin } from "./plugin.js"
import { mergeLeft } from "ramda"

const sell = (db, usd, sell_db) => {
  const k = db * usd

  const db2 = db + sell_db
  const usd2 = k / db2
  const bought_usd = usd - usd2

  const price = bought_usd / sell_db

  return price
}

function getDB(db, usd, price, sell_db) {
  let p = sell(db, usd, sell_db)
  if (p >= price) return [p, sell_db]
  const ten = sell_db / 100
  let amount = (sell_db -= ten)
  p = null
  while (amount > 0) {
    const p2 = sell(db, usd, amount)
    if (p2 >= price) {
      p = p2
      break
    }
    amount -= ten
  }
  return p ? [p, amount] : null
}

class Sim extends Simulator {
  constructor({ p }) {
    super({ p })
  }
  init({ g }) {
    this.v.gain = 0
    this.v.sold = 0
    this.v.unlocked = 0
    this.v.unsold = 0
    this.v.locked = (this.p.v.p / 100) * g(`${this.v.t.toLowerCase()}_its`)
    this.v.rate = this.v.locked / (this.v.vp * 30)
  }

  unlock(i) {
    let dur = this.v.vp * 30
    let cliff = this.v.c * 30
    let unlocked = 0
    if (i === cliff + dur - 1) {
      this.v.unlocked += this.v.locked
      this.v.unsold += this.v.locked
      this.v.locked = 0
      unlocked = this.v.locked
    } else if (i > cliff && i < cliff + dur) {
      this.v.locked -= this.v.rate
      this.v.unlocked += this.v.rate
      this.v.unsold += this.v.rate
      unlocked = this.v.rate
    }
    return unlocked
  }

  sell(dex) {
    let sold = 0
    if (this.v.unlocked > 0 && dex.v.pa >= this.v.sp) {
      const x = getDB(dex.v.la, dex.v.lb, this.v.sp, this.v.unsold)
      if (x !== null) {
        this.v.gain += x[0] * x[1]
        this.v.sold += x[1]
        sold = x[1]
        this.v.unsold -= x[1]
        dex.sellA(x[1])
      }
    }
    return sold
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
