# Security Policy

## Scope

SIGN is a **notation specification** plus a reference **validator/compiler**.
The most relevant classes of issue are:

* Parser or validator crashes, hangs, or unbounded resource use on crafted input
* Validation bypasses (a document accepted that the spec says must be rejected,
  or vice versa)
* Any code-execution or path-traversal risk in the validator/compiler CLI

## Supported Versions

Security fixes are applied to the latest released `v1.x` line and the `main`
branch. Older tags are not maintained.

## Reporting a Vulnerability

Please **do not open a public issue** for security-sensitive reports.

Use GitHub's private vulnerability reporting: go to the **Security** tab of this
repository and choose **"Report a vulnerability."** This opens a private
advisory visible only to the maintainers.

If you cannot use GitHub Security Advisories, email **info@careerhighways.com**.

Please include:

* A description of the issue and its impact
* Steps to reproduce (a minimal `.sign` input is ideal)
* The validator version or commit you tested against

## What to Expect

* We aim to acknowledge reports within a few business days.
* We will confirm the issue, keep you updated on remediation, and credit you in
  the release notes unless you prefer to remain anonymous.

Thank you for helping keep the SIGN ecosystem safe.
