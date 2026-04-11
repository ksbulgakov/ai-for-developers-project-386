# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a [Hexlet](https://hexlet.io) educational project repository. It currently serves as the starting scaffold for a course project — the actual project content will be added as the course progresses.

## CI/CD

- Automated tests run via GitHub Actions on every push (`.github/workflows/hexlet-check.yml`)
- **Do not delete, edit, or rename** `hexlet-check.yml` — it is required by the Hexlet platform
- Tests require a `HEXLET_ID` secret configured in the repository settings
- The repository must not be renamed, as the workflow is tied to it
