import assert from "assert"
import { afterEach, describe, it, beforeEach } from "node:test"
import { AI3 } from "../src/index.js"
import {
  vars,
  before,
  after,
  players,
} from "../../dashboard/lib/token/index.js"
import { clone } from "ramda"

describe("AI3", () => {
  it("should simulate with plugins", async () => {
    const ai3 = new AI3({ vars })
    const { nvars, res, stats } = ai3.simulate({
      before,
      after,
      players,
      years: 1,
    })
    assert.equal(nvars.dex_ai_l, 71)
  })
})
