import { pathToFileURL } from "node:url"

import type { RuntimeMode, ServerEnvSource } from "../app/config/server-env"
import { checkApp } from "./doctor/check-app"
import { checkArchitecture } from "./doctor/check-architecture"
import { checkDatabases } from "./doctor/check-databases"
import { checkEnv } from "./doctor/check-env"
import { checkFeatures } from "./doctor/check-features"
import { checkIntegrations } from "./doctor/check-integrations"
import { checkPrisma } from "./doctor/check-prisma"
import { checkPwa } from "./doctor/check-pwa"
import type { DoctorReport } from "./doctor/doctor-types"
import { createDoctorReport, doctorExitCode } from "./doctor/doctor-types"

export type DoctorArguments = {
  json: boolean
  production: boolean
  strict: boolean
}

export function parseDoctorArguments(args: string[]): DoctorArguments {
  const known = new Set(["--json", "--production", "--strict"])
  const unknown = args.find((argument) => !known.has(argument))
  if (unknown) throw new Error(`Unknown option: ${unknown}`)
  return {
    json: args.includes("--json"),
    production: args.includes("--production"),
    strict: args.includes("--strict"),
  }
}

export async function runDoctor({
  args = parseDoctorArguments(process.argv.slice(2)),
  projectRoot = process.cwd(),
  source = process.env,
}: {
  args?: DoctorArguments
  projectRoot?: string
  source?: ServerEnvSource
} = {}): Promise<DoctorReport> {
  const mode: RuntimeMode = args.production ? "production" : "development"
  const findings = [
    ...checkApp(),
    ...(await checkPwa(projectRoot)),
    ...checkEnv(source, mode),
    ...checkIntegrations(source),
    ...(await checkDatabases(projectRoot)),
    ...(await checkArchitecture(projectRoot)),
    ...(await checkFeatures({ projectRoot })),
    ...(await checkPrisma(projectRoot)),
  ]
  return createDoctorReport(findings, args.strict)
}

export function formatDoctorReport(report: DoctorReport) {
  const icons = { fail: "FAIL", pass: "PASS", warn: "WARN" } as const
  const lines = report.findings.flatMap((finding) => [
    `[${icons[finding.status]}] ${finding.category}/${finding.id}: ${finding.message}`,
    ...(finding.remediation ? [`  Fix: ${finding.remediation}`] : []),
  ])
  lines.push(
    "",
    `Summary: ${report.summary.pass} passed, ${report.summary.warn} warnings, ${report.summary.fail} failures.`,
    report.ready ? "Ready." : "Not ready.",
  )
  return lines.join("\n")
}

async function main() {
  const args = parseDoctorArguments(process.argv.slice(2))
  const report = await runDoctor({ args })
  console.log(
    args.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report),
  )
  process.exitCode = doctorExitCode(report)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main()
}
