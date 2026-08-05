import { describe, expect, test } from "vitest"

import {
  formatDoctorReport,
  parseDoctorArguments,
  runDoctor,
} from "./app-doctor"

describe("app doctor CLI", () => {
  test("given CLI flags, should parse output and readiness modes", () => {
    expect(
      parseDoctorArguments(["--json", "--strict", "--production"]),
    ).toEqual({
      json: true,
      production: true,
      strict: true,
    })
  })

  test("given development defaults, should produce stable redacted output", async () => {
    const secret = "never-print-this"
    const report = await runDoctor({
      args: { json: false, production: false, strict: false },
      source: { APP_URL: secret },
    })
    const output = formatDoctorReport(report)

    expect(output).not.toContain(secret)
    expect(output).toContain("Summary:")
  })

  test("given production mode without required configuration, should fail", async () => {
    const report = await runDoctor({
      args: { json: true, production: true, strict: false },
      source: {},
    })

    expect(report.ready).toBe(false)
    expect(report.findings).toContainEqual(
      expect.objectContaining({ id: "env:APP_URL", status: "fail" }),
    )
  })
})
