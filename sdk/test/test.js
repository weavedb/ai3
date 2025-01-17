import assert from "assert"
import { afterEach, describe, it, beforeEach } from "node:test"
import { AI3 } from "../src/index.js"
import {
  vars,
  before,
  after,
  players,
} from "../../dashboard/lib/token-ai/index.js"
import { clone } from "ramda"

describe("AI3", () => {
  it("should simulate", async () => {
    const ai3 = new AI3({ vars })
    const { nvars, res, stats } = ai3.simulate({
      before,
      after,
      players,
      years: 1,
    })
    assert.equal(nvars.ail, 71)
  })
  it("should find the best iusdcl", async () => {
    const ai3 = new AI3({ vars })
    const res = ai3.fuzz({
      cases: { iusdcl: { range: [10, 101] }, iail: { range: [50, 101] } },
      find: { aip: "max", diff: "min" },
      before,
      after,
      players,
      years: 1,
    })
    assert.equal(res.aip.case.iusdcl, 10)
    assert.equal(res.aip.case.iail, 57)
    assert.equal(res.diff.case.iusdcl, 100)
    assert.equal(res.diff.case.iail, 50)
  })
  it("should find the best iusdcl", async () => {
    let max = null
    for (let i = 10; i <= 100; i++) {
      let _vars = clone(vars)
      _vars.iusdcl.val = i
      const ai3 = new AI3({ vars: _vars })
      const { nvars, res, stats } = ai3.simulate({
        before,
        after,
        players,
        years: 1,
      })
      if (!max || max.aip < nvars.aip) {
        max = { iusdcl: _vars.iusdcl.val, aip: nvars.aip, res }
      }
    }
    assert.equal(max.iusdcl, 25)
    assert.equal(Math.floor(max.aip * 100) / 100, 1.13)
  })
})
