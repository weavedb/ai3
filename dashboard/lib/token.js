export const vars = {
  iail: { name: "Initial $AI Liquidity", val: 100, type: "AI" },
  iusdcl: { name: "Initial $USDC Liquidity", val: 50, decimal: 0 },
  iaip: {
    name: "Initial $AI Price",
    val: g => g("iusdcl") / g("iail"),
    calc: "IUSDCL / IAIL",
  },
  ail: {
    name: "$AI Liquidity",
    val: (g, r) => r.ai,
    type: "AI",
    calc: "DEX()",
  },
  usdcl: {
    name: "$USDC Liquidity",
    val: (g, r) => r.usdc,
    decimal: 0,
    calc: "DEX()",
  },
  aip: {
    name: "$AI Price",
    val: (g, r) => r.usdc / r.ai,
    color: "crimson",
    calc: "USDCL / AIL",
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
}

export const before = ({ v }) => {
  return {
    price: v.iusdcl / v.iail,
    ai: v.iail,
    usdc: v.iusdcl,
    total_buy: 0,
    total_sell: 0,
  }
}

export const after = ({ v, s, r }) => {
  r.diff = r.price - s[0].price
}

const buyer = {
  key: "BUYER",
  desc: "Buyer buys 10 $AI if the price is less than or equal to $1.",
  fn: ({ v, s, i, r }) => {
    if (r.price <= 1) {
      const ai = r.ai - 10
      const usdc = (r.usdc * r.ai) / ai
      r.ai = ai
      r.usdc = usdc
      r.price = usdc / ai
      r.total_buy += 10
      s[i].buy = 10
    }
  },
}

const seller = {
  key: "SELLER",
  desc: "Seller sells 7 $AI if the price is more than or equal to $1.",
  fn: ({ v, s, r, i }) => {
    if (r.price >= 1) {
      const ai = r.ai + 7
      const usdc = (r.usdc * r.ai) / ai
      r.ai = ai
      r.usdc = usdc
      r.price = usdc / ai
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
    lines: [{ label: "$AI Price", val: "price", floor: false }],
  },
  {
    key: "dex",
    name: "DEX Trades",
    lines: [
      { label: "$AI Sell", val: "total_sell" },
      { label: "$AI Buy", val: "total_buy", color: "#DC143C" },
    ],
  },
]

export const table = [
  {
    key: "dex",
    name: "DEX",
    cols: [
      { title: "Day", w: "40px", val: "i" },
      { title: "AI", val: "ai" },
      { title: "USDC", val: "usdc" },
      { title: "Buy", val: v => v.buy ?? 0 },
      { title: "Sell", val: v => v.sell ?? 0 },
      {
        title: "Total",
        val: v => (v.sell ?? 0) - (v.buy ?? 0),
        color: val => (val < 0 ? "crimson" : "royalblue"),
      },
      { title: "Price", val: v => `$ ${v.price.toFixed(3)}` },
    ],
  },
]

export const stats = g => [
  {
    title: "$AI Price",
    val: `$${(Math.floor(g("aip") * 100) / 100).toFixed(2)}`,
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
      vals: "iail,iusdcl,iaip,aip,diff,ail,usdcl,buy,sell",
    },
  ],
]

export const players = [buyer, seller]
