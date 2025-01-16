import { useEffect, useState } from "react"
import { FormatNumber, Input, Box, Flex, Image } from "@chakra-ui/react"
import { isNil, range, map, clone, prop, addIndex, is } from "ramda"

import {
  vars,
  cols,
  graphs,
  before,
  after,
  players,
  stats as wstats,
  table,
} from "../lib/token"

import { AI3, get } from "ai3"
import { set, make } from "../lib/simulator"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
let to = null

const _table = (o, s, set) => make(o, s, set, cols)

function bg(lineColor, factor = 0.6) {
  if (!/^#/.test(lineColor)) return lineColor
  const hexToRgb = hex => {
    const bigint = parseInt(hex.slice(1), 16)
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
  }
  const rgbToHex = (r, g, b) =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  const blendWithWhite = (rgb, factor) =>
    rgb.map(channel => Math.round(channel + (255 - channel) * factor))
  const rgb = hexToRgb(lineColor)
  const lighterRgb = blendWithWhite(rgb, factor)
  const lrgb = rgbToHex(...lighterRgb)

  return rgbToHex(...lighterRgb)
}
export default function Home({ _date = null }) {
  const [o, setO] = useState(vars)
  const [s, setS] = useState({})
  const [target, setTarget] = useState(graphs[0])
  const [tbl, setTBL] = useState(table[0])
  const [stats, setStats] = useState([])
  const [graph, setGraph] = useState(false)
  const [years, setYears] = useState(3)
  const g = get(o, s)
  const top_stats = wstats(g)

  useEffect(() => {
    clearTimeout(to)
    const sim = new AI3({ vars: o })
    const { res: _s, stats: _stats } = sim.simulate({
      before,
      after,
      players,
      years,
    })
    setS(_s)
    to = setTimeout(() => setStats(_stats), 0)
  }, [o, years])
  const vals = _table(o, s, setO)

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  )

  const options = { responsive: true, plugins: { legend: { position: "top" } } }

  let labels = []
  let i = 0
  let span = target.span ?? 1
  let w = 1
  let sums = {}
  for (let v of target.lines) sums[v.val] = { num: 0, sum: 0 }

  let _stats = []
  for (let v of stats) {
    for (let v2 of target.lines) {
      sums[v2.val].num += 1
      sums[v2.val].sum += v[v2.val]
    }
    if (i === w * span - 1) {
      labels.push(v.i)
      let s = {}
      for (let v of target.lines) {
        const av = sums[v.val].sum / sums[v.val].num
        s[v.val] = av
        sums[v.val] = { num: 0, sum: 0 }
      }
      _stats.push(s)
      w++
    }
    i++
  }
  if (sums.num > 0) {
    labels(i)
    stats.push({ price: sums.av })
  }
  const data = {
    labels,
    datasets: map(v0 => {
      return {
        label: v0.label,
        data: map(v => {
          let n = prop(v0.val, v)
          return v0.floor !== false ? Math.floor(n) : n
        })(_stats),
        borderColor: v0.color ?? "#5137C5",
        backgroundColor: v0.bg ? v0.bg : bg(v0.color ?? "#5137C5"),
        pointStyle: false,
        ...(v0.line === "dashed" ? { borderDash: [5, 5] } : {}),
      }
    })(target.lines),
  }

  return (
    <Flex
      color="#222"
      fontSize="9px"
      css={{ fontFamily: "monospace, monospace", overflowY: "hidden" }}
      h="calc(100vh)"
    >
      <Flex>
        <Box
          bg="white"
          w="700px"
          css={{
            zIndex: 100,
            borderRight: "1px solid #eee",
          }}
        >
          <Flex p={4} fontSize="16px" align="center" color="#5137C5">
            <Image src="/logo.svg" h="20px" mr={3} />
            <select
              style={{
                fontWeight: "bold",
                paddingLeft: "10px",
                paddingRight: "10px",
                paddingTop: "2px",
                paddingBottom: "2px",

                border: "2px solid #9C89F6",
                background: "white",
                color: "#9C89F6",
                borderRadius: "3px",
              }}
              value={years}
              onChange={e => {
                setStats([])
                setGraph(false)
                setYears(e.target.value)
              }}
            >
              {map(v => <option value={v}>{v}</option>)(range(0, 11))}
            </select>
            <Box ml={3}>Year Projections</Box>
          </Flex>
          <Box p={2} align="center">
            <Flex px={4} justify="center">
              {map(v => {
                return (
                  <Box
                    mx={2}
                    p={4}
                    w="120px"
                    color="#5137C5"
                    css={{ border: "2px solid #9C89F6", borderRadius: "3px" }}
                  >
                    <Box fontWeight="bold" fontSize="16px" textAlign="center">
                      {v.val}
                    </Box>
                    <Box textAlign="center" fontSize="10px" mt={1}>
                      {v.title}
                    </Box>
                  </Box>
                )
              })(top_stats)}
            </Flex>
          </Box>
          <Box h="40vh">
            <Box mx={8} mt={2}>
              <select
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                  paddingTop: "2px",
                  paddingBottom: "2px",
                  border: "2px solid #9C89F6",
                  background: "white",
                  color: "#9C89F6",
                  borderRadius: "3px",
                }}
                value={target.key}
                onChange={e => {
                  for (let v of graphs) {
                    if (v.key === e.target.value) setTarget(v)
                  }
                }}
              >
                {map(v => <option value={v.key}>{v.name}</option>)(graphs)}
              </select>
            </Box>
            <Flex h="100%" py={4} px={8} justify="center">
              <Line options={options} data={data} />
            </Flex>
          </Box>
          <Box mx={8} mb={4}>
            <select
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                paddingLeft: "10px",
                paddingRight: "10px",
                paddingTop: "2px",
                paddingBottom: "2px",
                border: "2px solid #9C89F6",
                background: "white",
                color: "#9C89F6",
                borderRadius: "3px",
              }}
              value={tbl.key}
              onChange={e => {
                for (let v of table) if (v.key === e.target.value) setTBL(v)
              }}
            >
              {map(v => <option value={v.key}>{v.name}</option>)(table)}
            </select>
          </Box>
          <Flex
            color="#5137C5"
            css={{
              borderBottom: "1px solid #5137C5",
              borderTop: "1px solid #5137C5",
              overflowY: "scroll",
            }}
            p={1}
            textAlign="right"
            py={2}
          >
            {map(v => {
              return (
                <Box px={2} w={v.w ?? "70px"}>
                  {v.title}
                </Box>
              )
            })(tbl?.cols ?? [])}
          </Flex>
          <Box
            fontSize="9px"
            h="calc(60vh - 258px)"
            css={{ overflowY: "scroll" }}
          >
            {stats.length === 0 ? (
              <Flex
                justify="center"
                align="center"
                h="100%"
                fontSize="16px"
                color="#5137C5"
              >
                Generating...
              </Flex>
            ) : (
              <>
                {!graph ? (
                  <Flex
                    align="center"
                    justify="center"
                    h="100%"
                    fontSize="16px"
                  >
                    <Flex
                      py={2}
                      px={4}
                      color="#5137C5"
                      css={{
                        borderRadius: "3px",
                        cursor: "pointer",
                        _hover: { opacity: 0.75 },
                        border: "1px solid #5137C5",
                      }}
                      onClick={() => setGraph(true)}
                    >
                      Show Table
                    </Flex>
                  </Flex>
                ) : (
                  map(v => {
                    return (
                      <Flex
                        color="#222"
                        css={{
                          borderBottom: "1px solid #eee",
                        }}
                        p={1}
                        textAlign="right"
                      >
                        {map(v2 => {
                          let val = "-"
                          if (typeof v2.val === "function") {
                            val = v2.val(v)
                          } else {
                            val = v[v2.val] ?? "-"
                            if (v2.floor !== false) val = Math.floor(val)
                          }
                          return (
                            <Box
                              w={v2.w ?? "70px"}
                              px={2}
                              color={
                                is(Function, v2.color)
                                  ? v2.color(val, v)
                                  : (v.color ?? "#222")
                              }
                            >
                              {val}
                            </Box>
                          )
                        })(tbl?.cols ?? [])}
                      </Flex>
                    )
                  })(table ? stats : [])
                )}
              </>
            )}
          </Box>
        </Box>
        <Box
          w="480px"
          px={4}
          css={{
            borderRight: i < 2 ? "1px solid #eee" : null,
            overflowY: "scroll",
          }}
          h="calc(100vh - 15px)"
          pb={4}
        >
          <Flex
            mt={2}
            fontSize="14px"
            fontWeight="bold"
            align="center"
            h="20px"
            color="#5137C5"
            css={{ textDecoration: "underline" }}
          >
            Simulated Strategies
          </Flex>
          {map(v => {
            return (
              <Flex h="36px" align="center">
                <Box w="80px" css={{ borderRight: "1px solid #ccc" }} px={2}>
                  <Box
                    fontWeight="bold"
                    textAlign="right"
                    fontSize="11px"
                    color="#5137C5"
                  >
                    {v.key}
                  </Box>
                  <Box color="#666" textAlign="right">
                    {v.name}
                  </Box>
                </Box>

                <Box flex={1} px={2}>
                  <Box color="#666">{v.desc}</Box>
                </Box>
              </Flex>
            )
          })(players)}
        </Box>
        {addIndex(map)((v0, i) => {
          return (
            <Box
              w="480px"
              px={4}
              css={{
                borderRight: i < 2 ? "1px solid #eee" : null,
                overflowY: "scroll",
              }}
              h="calc(100vh - 15px)"
              pb={4}
            >
              {map(v =>
                v.title ? (
                  <Flex
                    mt={2}
                    fontSize="14px"
                    fontWeight="bold"
                    align="center"
                    h="20px"
                    color="#5137C5"
                    css={{ textDecoration: "underline" }}
                  >
                    {v.title}
                  </Flex>
                ) : (
                  <Flex h="36px" align="center">
                    <Box
                      w="170px"
                      css={{ borderRight: "1px solid #ccc" }}
                      px={2}
                    >
                      <Box
                        fontWeight="bold"
                        textAlign="right"
                        fontSize="11px"
                        color={v.color ?? "#222"}
                      >
                        {v.key}
                      </Box>
                      <Box color="#666" textAlign="right">
                        {v.name}
                      </Box>
                    </Box>
                    <Box
                      w="110px"
                      align="center"
                      px={2}
                      textAlign="right"
                      fontSize="11px"
                    >
                      {isNil(v.type) || v.type === "usd" ? (
                        <FormatNumber
                          value={
                            v.floor !== false
                              ? Math.floor(v.num * 10 ** (v.decimal ?? 2)) /
                                10 ** (v.decimal ?? 2)
                              : v.num
                          }
                          style="currency"
                          currency="usd"
                          maximumSignificantDigits={14}
                        />
                      ) : (
                        <Box>
                          <FormatNumber
                            value={
                              v.floor !== false
                                ? Math.floor(v.num * 10 ** (v.decimal ?? 0)) /
                                  10 ** (v.decimal ?? 0)
                                : v.num
                            }
                          />
                          <Box
                            as="span"
                            ml={v.type === "" ? 0 : 1}
                            fontSize="9px"
                            color="#666"
                          >
                            {v.type}
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <Box flex={1} px={2}>
                      {v.calc ? (
                        <Box color="#666">
                          {`=`} {v.calc}
                        </Box>
                      ) : (
                        <Input
                          px={2}
                          value={v.val}
                          onChange={e => {
                            setStats([])
                            setGraph(false)
                            set(e, v.set)
                          }}
                          h="26px"
                        />
                      )}
                    </Box>
                  </Flex>
                ),
              )(v0)}
            </Box>
          )
        })(vals)}
      </Flex>
    </Flex>
  )
}
