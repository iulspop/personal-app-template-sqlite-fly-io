import { describe, expect, test } from "vitest"

import { createDoctorReport, doctorExitCode } from "./doctor-types"

const finding = (status: "pass" | "warn" | "fail") => ({
  category: "app" as const,
  id: status,
  message: status,
  status,
})

describe("doctor report", () => {
  test("given passing and warning findings, should be ready by default", () => {
    const report = createDoctorReport([finding("warn"), finding("pass")])

    expect(report).toMatchObject({
      ready: true,
      summary: { fail: 0, pass: 1, warn: 1 },
    })
    expect(doctorExitCode(report)).toBe(0)
  })

  test("given strict mode warnings, should return a blocking report", () => {
    const report = createDoctorReport([finding("warn")], true)

    expect(report.ready).toBe(false)
    expect(doctorExitCode(report)).toBe(1)
  })

  test("given failures, should return a blocking report", () => {
    const report = createDoctorReport([finding("fail")])

    expect(report.ready).toBe(false)
    expect(doctorExitCode(report)).toBe(1)
  })
})
