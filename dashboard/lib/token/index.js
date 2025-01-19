export const vars = {
  __title__: "$AI Token",
  iaip: {
    name: "Initial $AI Price",
    val: g => g("dex_usdc_il") / g("dex_ai_il"),
    calc: "DEX_USDC_IL / DEX_AI_IL",
  },
  buy: {
    name: "Total $AI Buy",
    val: (g, r) => r.total_buy,
    type: "AI",
    calc: "DEX()",
  },
  sell: {
    name: "Total $AI Sell",
    val: (g, r) => r.total_sell,
    type: "AI",
    calc: "DEX()",
  },
  diff: {
    name: "$AI Price Diff",
    val: (g, r) => r.diff,
    calc: "DEX()",
  },
  __plugins__: {
    ai: { type: "token", ticker: "AI", supply: 10000 },
    dex: {
      type: "dex",
      tokenA: "AI",
      tokenB: "USDC",
      liquidityA: 100,
      liquidityB: 50,
    },
  },
}

export const before = ({ v }) => ({ total_buy: 0, total_sell: 0 })

export const after = ({ v, s, r, p }) => {
  r.diff = p.dex.v.pa - v.iaip
  p.ai.v.price = p.dex.v.pa
}

const buyer = {
  key: "BUYER",
  desc: "Buyer buys 10 $AI if the price is less than or equal to $1.",
  fn: ({ v, s, i, r, p }) => {
    if (p.dex.v.pa <= 1) {
      p.dex.buyA(10)
      r.total_buy += 10
      s[i].buy = 10
    }
  },
}

const seller = {
  key: "SELLER",
  desc: "Seller sells 7 $AI if the price is more than or equal to $1.",
  fn: ({ v, s, r, i, p }) => {
    if (p.dex.v.pa >= 1) {
      p.dex.sellA(7)
      r.total_sell += 7
      s[i].sell = 7
    }
  },
}

export const graphs = [
  {
    key: "price",
    name: "$AI Price",
    span: 7,
    lines: [{ label: "$AI Price", key: "dex.pa", floor: false }],
  },
  {
    key: "dex",
    name: "DEX Trades",
    lines: [
      { label: "$AI Sell", key: "total_sell" },
      { label: "$AI Buy", key: "total_buy", color: "#DC143C" },
    ],
  },
]

export const table = [
  {
    key: "dex",
    name: "DEX",
    cols: [
      { title: "Day", w: "40px", val: "i" },
      { title: "AI", val: "dex.la" },
      { title: "USDC", val: "dex.lb" },
      { title: "Buy", val: v => v.buy ?? 0 },
      { title: "Sell", val: v => v.sell ?? 0 },
      {
        title: "Total",
        val: v => (v.sell ?? 0) - (v.buy ?? 0),
        color: val => (val < 0 ? "crimson" : "royalblue"),
      },
      { title: "Price", val: v => `$ ${v.dex.pa.toFixed(3)}` },
    ],
  },
]

export const stats = g => [
  {
    title: "$AI Price",
    val: `$${(Math.floor(g("dex_ai_p") * 100) / 100).toFixed(2)}`,
  },
  {
    title: "Initial Price",
    val: `$${(Math.floor(g("iaip") * 100) / 100).toFixed(2)}`,
  },
  {
    title: "Price Diff",
    val: `$${(Math.floor(g("diff") * 100) / 100).toFixed(2)}`,
  },
]

export const cols = [
  [
    {
      title: "Projections",
      vals: "iaip,diff,buy,sell",
    },
    {
      title: "$AI Token",
      vals: "ai_its,ai_p,ai_fdv",
    },
    { title: "DEX", vals: "dex_ai_il,dex_usdc_il,dex_k,dex_ai_l,dex_usdc_l" },
  ],
]

export const players = [buyer, seller]
