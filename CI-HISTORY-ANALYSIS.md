# CI History Analysis

**Repository:** `ci-health-drill` (Node.js payment platform)  
**Analysis Scope:** Last 30 GitHub Actions workflow runs  
**Workflows Reviewed:** `CI` (`.github/workflows/ci.yml`), `Security Scan` (`.github/workflows/security-scan.yml`)  
**Purpose:** Assess CI reliability and identify workflow risks before sprint planning.

---

# Task 1 — Analysis of the Last 30 Workflow Runs

**Legend**

- ✅ = Successful workflow
- ❌ = Failed workflow
- **First Failed Job** = First job that caused the workflow to stop
- **Failure Source** = Whether the failure was caused by an application code change or by the CI configuration/environment

| Run | Date | Commit / Trigger | Outcome | First Failed Job | Failed Step | Failure Source |
|-----:|------|------------------|:------:|-----------------|-------------|----------------|
| 30 | 2026-05-27 | `aea721e` – skip flaky gateway test again | ❌ | `test` | `npm test` | Configuration |
| 29 | 2026-05-27 | `8850966` – document edge cases | ❌ | `test` | `npm test` | Configuration |
| 28 | 2026-05-27 | `e497451` – README formatting | ❌ | `test` | `npm test` | Configuration (docs-only change) |
| 27 | 2026-05-27 | `2294e50` – token validation note | ❌ | `test` | `npm test` | Configuration |
| 26 | 2026-05-27 | `2d90333` – logging update | ❌ | `test` | `npm test` | Configuration |
| 25 | 2026-05-26 | `22d3b40` – enable gateway integration test | ❌ | `test` | Gateway integration test | Code/Test |
| 24 | 2026-05-26 | `22d3b40` (re-run) | ✅ | — | — | Flaky retry |
| 23 | 2026-05-26 | `22d3b40` (re-run) | ❌ | `test` | Gateway integration test | Code/Test |
| 22 | 2026-05-25 | `4bcd7a9` – validation cleanup | ❌ | `test` | `npm test` | Configuration |
| 21 | 2026-05-25 | `555475f` – validation review | ❌ | `test` | `npm test` | Configuration |
| 20 | 2026-05-24 | `f51f14a` – payment verification | ❌ | `test` | `npm test` | Configuration |
| 19 | 2026-05-24 | `af8ec1c` – disable scan temporarily | ❌ | `test` | `npm test` | Configuration |
| 18 | 2026-05-23 | `af8ec1c` (security scan skipped) | ❌ | `test` | `npm test` | Configuration |
| 17 | 2026-05-23 | `30516e1` – debug logging | ❌ | `test` | `npm test` | Configuration |
| 16 | 2026-05-22 | `4a70974` – version update | ❌ | `test` | `npm test` | Configuration |
| 15 | 2026-05-22 | `0f4e90a` – skip failing test | ❌ | `test` | `npm test` | Configuration |
| 14 | 2026-05-21 | `0d9287c` – auth hotfix | ❌ | `test` | `npm test` | Configuration |
| 13 | 2026-05-21 | `0d9287c` (re-run) | ❌ | `test` | `npm test` | Configuration |
| 12 | 2026-05-20 | `fbd120d` – urgent payment fix | ❌ | `test` | `npm test` | Configuration |
| 11 | 2026-05-20 | `fbd120d` (direct push) | ❌ | `test` | `npm test` | Configuration |
| 10 | 2026-05-19 | `0311ceb` – CI setup | ❌ | `test` | `npm test` | Configuration |
| 9 | 2026-05-19 | validateAmount update | ❌ | `test` | Gateway integration test | Code/Test |
| 8 | 2026-05-18 | routine push | ❌ | `test` | `npm test` | Configuration |
| 7 | 2026-05-18 | token validation update | ❌ | `test` | `npm test` | Configuration |
| 6 | 2026-05-17 | currency logging | ❌ | `test` | `npm test` | Configuration |
| 5 | 2026-05-17 | routine push | ❌ | `test` | `npm test` | Configuration |
| 4 | 2026-05-16 | validation debug logging | ❌ | `test` | Gateway integration test | Code/Test |
| 3 | 2026-05-16 | token validator trigger | ❌ | `test` | `npm test` | Configuration |
| 2 | 2026-05-15 | process payment update | ❌ | `test` | `npm test` | Configuration |
| 1 | 2026-05-15 | initial CI setup | ❌ | `install` / `test` | `npm test` | Configuration |

> **Observation:** During the analysis period, no successful execution of the **Security Scan** workflow was found. The workflow is effectively disabled because it contains `if: false`.

---

# Failure Rate

| Metric | Value |
|--------|------:|
| Total workflow runs | **30** |
| Successful runs | **1** |
| Failed runs | **29** |
| Overall failure rate | **96.7%** |

With only one successful workflow execution out of thirty, the current CI pipeline provides very little confidence. Developers are exposed to continuous red builds, making it difficult to distinguish genuine regressions from pipeline issues.

---

# Failure Breakdown by Job

| Job | Primary Cause | Occurrences | Failure Type |
|-----|---------------|------------:|--------------|
| `test` | Missing project dependencies (`jest: not found`) | 25 | Consistent |
| `test` | Gateway integration timeout | 4 | Flaky |
| `install` | Does not provide dependencies to downstream jobs | Structural issue | Configuration |
| `security-scan` | Workflow disabled (`if: false`) | Not executed | Configuration |

---

# Flaky vs Consistent Failures

## Consistent Failures

The majority of failures originate from the **test** job.

The workflow checks out the repository and immediately executes:

```bash
npm test
```

However, the job never installs project dependencies (`npm ci` or `npm install`).

As a result, almost every run ends with the same error:

```text
> ci-health-drill@1.0.1 test
> jest --forceExit

sh: 1: jest: not found

Error: Process completed with exit code 127.
```

This issue occurred in **25 of the 29 failed runs**, including documentation-only commits, indicating that the failures are unrelated to application code and are completely deterministic.

---

## Flaky Failures

A smaller set of failures comes from the payment gateway integration test.

The test performs a live request to:

```text
https://httpstat.us/200?sleep=100
```

Several runs failed with the following timeout:

```text
Timeout - Async callback was not invoked within the 5000 ms timeout

at src/payments/processPayment.test.js
```

The same commit (`22d3b40`) failed on one execution but passed on a subsequent retry without any code changes, demonstrating classic flaky test behavior.

---

# Task 2 — Failure Pattern Classification

Severity has been estimated using the **Impact × Frequency** approach discussed in class.

| Failure Pattern | Risk Category | Supporting Evidence | Severity |
|-----------------|---------------|---------------------|----------|
| Test job executes without installing dependencies (`jest: not found`) | Workflow Configuration Quality | 25 identical failures across 30 runs | **Critical** |
| Live gateway integration test produces inconsistent timeout failures | Test Reliability | Same commit fails and passes on different executions | **High** |
| Security Scan workflow permanently disabled using `if: false` | Merge Safety Indicators | No security scan execution recorded during analysis | **Critical** |
| Direct pushes to `main`, outdated Node.js version, use of `npm install` | Validation Instability | Hotfix commits pushed directly to `main`; outdated workflow configuration | **High** |
| Multiple tests skipped instead of fixed (`test.skip`) | Test Reliability | Validation and gateway tests intentionally skipped | **Medium** |

---

# Overall Findings

The CI pipeline is currently in poor health, with a **96.7% workflow failure rate** over the analyzed period.

The dominant issue is a workflow configuration problem where the test job runs without installing project dependencies, causing identical failures regardless of the actual code changes. In addition, flaky integration tests, a disabled security scanning workflow, and weak merge practices significantly reduce confidence in the pipeline.

These findings indicate that restoring CI reliability should be treated as a high-priority engineering task before introducing additional features or relying on the pipeline for release decisions.