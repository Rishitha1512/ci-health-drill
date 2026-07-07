# CI Health Report

**Repository:** `ci-health-drill`  
**Prepared for:** Sprint Planning / Team Lead  
**Analysis Scope:** Last 30 GitHub Actions workflow runs  
**Working Branch:** `report/ci-health-analysis`  
**Supporting Analysis:** [`CI-HISTORY-ANALYSIS.md`](./CI-HISTORY-ANALYSIS.md)

---

# 1. Executive Summary

An analysis of the most recent **30 GitHub Actions workflow runs** shows that the CI pipeline is currently unreliable, with **29 failures and only 1 successful execution**, resulting in an overall **96.7% failure rate**.

The investigation indicates that most failures are caused by workflow configuration rather than application code. The `test` job attempts to execute the test suite before project dependencies are installed, causing repeated `jest: not found` failures. In addition, the Security Scan workflow has been disabled, some tests depend on live external services, and emergency fixes have been committed directly to the `main` branch without sufficient validation.

The three highest-priority risks identified during this review are:

1. **Misconfigured test workflow causing nearly every CI run to fail** *(Critical – Workflow Configuration Quality)*
2. **Disabled Security Scan workflow leaving the main branch without automated vulnerability checks** *(Critical – Merge Safety Indicators)*
3. **Flaky integration tests relying on external network services** *(High – Test Reliability)*

These issues significantly reduce confidence in the CI pipeline and should be addressed before relying on CI results for release decisions.

---

# 2. Workflow Observations

## Observation 1 – Test Job Missing Dependency Installation

### Finding

The **test** job executes `npm test` without first installing project dependencies. Since `node_modules` is not available, Jest cannot be found and the workflow fails immediately.

### Evidence

This issue occurred in **25 of the 30 analyzed runs**, including documentation-only commits where no application code changed.

Example log output:

```text
> jest --forceExit

sh: 1: jest: not found

Error: Process completed with exit code 127.
```

Representative runs include **#1, #10, #22, #28, and #30**.

### Impact

Because the workflow consistently fails before running the actual test suite, developers cannot determine whether new code introduces regressions. The CI pipeline no longer serves as a reliable quality gate.

---

## Observation 2 – Security Scan Workflow Disabled

### Finding

The dedicated **Security Scan** workflow is disabled using the workflow condition:

```yaml
if: false
```

As a result, dependency vulnerability checks are never executed.

### Evidence

No Security Scan workflow executions were found within the last **30 workflow runs**.

Workflow configuration:

```yaml
jobs:
  scan:
    if: false
```

This configuration has remained unchanged throughout the analyzed period.

### Impact

Without automated security scanning, vulnerable dependencies may be merged into the main branch without detection, increasing the security risk for the payment platform.

---

## Observation 3 – Flaky Gateway Integration Test

### Finding

One integration test performs a live request to an external service (`httpstat.us`), making the test dependent on network conditions instead of application behavior.

### Evidence

The same commit (`22d3b40`) produced different results:

- **Run #23:** Failed
- **Run #24:** Passed

Example failure message:

```text
Timeout - Async callback was not invoked within the 5000 ms timeout

at src/payments/processPayment.test.js
```

The same timeout was also observed in runs **#4, #9, and #25**.

### Impact

Flaky tests reduce confidence in CI results because failures may occur even when the application code is unchanged. Developers often ignore failures or disable unstable tests instead of resolving the underlying issue.

---

## Observation 4 – Weak Validation and Merge Practices

### Finding

Several process-related issues reduce overall CI reliability:

- Direct pushes were made to the `main` branch.
- The workflow still uses **Node.js 16**, which has reached end-of-life.
- Dependencies are installed using `npm install` instead of the reproducible `npm ci`.

### Evidence

Examples include:

- Commit `fbd120d` (urgent payment hotfix)
- Commit `0d9287c` (authentication patch)

Workflow configuration:

```yaml
node-version: '16'

- run: npm install
```

### Impact

Direct pushes bypass normal review processes, while outdated tooling and non-reproducible dependency installation increase the likelihood of inconsistent builds across environments.

---

## Observation 5 – Skipped Tests Reduce Coverage

### Finding

Some tests are intentionally skipped using `test.skip()` instead of being fixed.

### Evidence

Example:

```javascript
test.skip("rejects negative amounts", () => {
    expect(validateAmount(-50)).toBe(false);
});
```

This skipped test remains in the repository throughout the analysis period.

### Impact

Skipping tests hides potential defects and reduces overall confidence in the application's financial validation logic.

---

# 3. Risk Analysis Table

| Observation | Finding Summary | Risk Category | Severity |
|--------------|----------------|---------------|----------|
| O1 | Test job executes without installing dependencies | Workflow Configuration Quality | **Critical** |
| O2 | Security Scan workflow is disabled | Merge Safety Indicators | **Critical** |
| O3 | Gateway integration test is flaky | Test Reliability | **High** |
| O4 | Direct pushes, outdated Node.js version, and `npm install` usage | Validation Instability | **High** |
| O5 | Tests skipped instead of fixed | Test Reliability | **Medium** |

---

# 4. Corrective Actions

## Recommendation 1 (Addresses Observation O1)

**Priority:** **P1 – This Sprint**

**Problem**

The test workflow fails because project dependencies are unavailable.

**Recommended Action**

- Install dependencies using `npm ci` before executing the test suite.
- Configure the workflow so the test job either performs its own installation or depends on an installation job.

**Configuration File**

```
.github/workflows/ci.yml
```

**Expected Outcome**

The workflow will execute the actual test suite instead of failing immediately, greatly improving CI reliability.

---

## Recommendation 2 (Addresses Observation O2)

**Priority:** **P1 – This Sprint**

**Problem**

The Security Scan workflow never executes.

**Recommended Action**

Remove the `if: false` condition so that dependency vulnerability scanning runs automatically on every pull request and push to the main branch.

**Configuration File**

```
.github/workflows/security-scan.yml
```

**Expected Outcome**

All code entering the repository will be checked for dependency vulnerabilities before merging.

---

## Recommendation 3 (Addresses Observation O3)

**Priority:** **P2 – Next Sprint**

**Problem**

The payment gateway integration test depends on an external website.

**Recommended Action**

Replace the live HTTP request with mocked responses using tools such as **Jest mocks** or **Nock**, and move true end-to-end tests into a separate scheduled workflow.

**Files**

```
src/payments/processPayment.test.js
```

**Expected Outcome**

The test suite becomes deterministic and no longer fails because of network instability.

---

## Recommendation 4 (Addresses Observation O4)

**Priority:** **P2 – Next Sprint**

**Problem**

Direct commits to `main`, outdated Node.js, and non-reproducible dependency installation reduce workflow stability.

**Recommended Action**

- Enable branch protection rules.
- Require pull requests and successful CI checks before merging.
- Upgrade to Node.js LTS.
- Replace `npm install` with `npm ci`.

**Configuration**

- `.github/workflows/ci.yml`
- GitHub Repository → **Settings → Branch Protection**

**Expected Outcome**

More consistent builds, improved code review practices, and greater confidence in release quality.

---

## Recommendation 5 (Addresses Observation O5)

**Priority:** **P3 – Backlog**

**Problem**

Skipped tests reduce overall test coverage.

**Recommended Action**

Implement the missing functionality where necessary and replace every `test.skip()` with active test cases.

**Files**

```
src/utils/validateAmount.test.js
```

**Expected Outcome**

Improved coverage and stronger validation of business-critical payment logic.

---

# 5. Reliability Evidence

The following screenshots should be included with the report to support the observations above.

| Screenshot | Evidence Provided |
|------------|-------------------|
| **Run #28 showing `jest: not found`** | Demonstrates the recurring dependency installation issue |
| **GitHub Actions history showing repeated failures** | Supports the calculated 96.7% failure rate |
| **Security Scan workflow configuration (`if: false`)** | Confirms the security workflow is disabled |
| **Runs #23 and #24 for the same commit** | Demonstrates flaky integration test behavior |
| **Commit history showing direct pushes to `main`** | Supports the merge safety observation |

> Store these screenshots inside an `evidence/` directory within the repository and reference them from this report before submitting the assignment.