import { is, mapObjIndexed, mergeLeft } from "ramda"
import { map, clone, flatten } from "ramda"

export const set = (e, _set) => {
  const v = e.target.value
  if (v === "" || !Number.isNaN(+v)) _set(e.target.value)
}

export const make = (o, _s, set, obj) => {
  const g = v3 => (is(Function, o[v3].val) ? o[v3]?.val(g, _s) : o[v3]?.val)
  return map(v => {
    const r = map(v3 => {
      return [
        v3,
        ...(!v3.vals
          ? []
          : map(v2 => {
              const o2 = o[v2]
              if (typeof v2 === "object") return v2
              const val = typeof o2.val === "function" ? o2.val(g, _s) : o2.val
              return {
                key: v2.toUpperCase(),
                num: val,
                calc: typeof o2.val === "function" ? (o2.calc ?? "-") : null,
                val: Number(val).toString(),
                set: v => {
                  let _o = clone(o)
                  if (v === "" || !Number.isNaN(+v)) {
                    _o[v2].val = +v
                    set(_o)
                  }
                },
                type: o2.type,
                decimal: o2.decimal,
                floor: o2.floor,
                color: o2.color,
                name: o2.name,
              }
            })((v3.vals ?? "").split(","))),
      ]
    })(v)
    return flatten(r)
  })(obj)
}