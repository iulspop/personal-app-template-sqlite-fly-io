export const doctorStatuses = ["pass", "warn", "fail"] as const
export type DoctorStatus = (typeof doctorStatuses)[number]

export const doctorCategories = [
  "app",
  "pwa",
  "environment",
  "database",
  "architecture",
  "prisma",
  "integrations",
] as const
export type DoctorCategory = (typeof doctorCategories)[number]

export type DoctorFinding = {
  category: DoctorCategory
  id: string
  message: string
  remediation?: string
  status: DoctorStatus
}

export type DoctorReport = {
  findings: DoctorFinding[]
  ready: boolean
  summary: {
    fail: number
    pass: number
    warn: number
  }
}

export function createDoctorReport(
  findings: DoctorFinding[],
  strict = false,
): DoctorReport {
  const summary = findings.reduce(
    (counts, finding) => {
      counts[finding.status] += 1
      return counts
    },
    { fail: 0, pass: 0, warn: 0 },
  )
  return {
    findings: [...findings].sort((left, right) =>
      `${left.category}:${left.id}`.localeCompare(
        `${right.category}:${right.id}`,
      ),
    ),
    ready: summary.fail === 0 && (!strict || summary.warn === 0),
    summary,
  }
}

export function doctorExitCode(report: DoctorReport) {
  return report.ready ? 0 : 1
}
