# Contributing to EduReach

First off, thank you for considering contributing to EduReach! It's people like you that make EduReach an amazing educational companion for students worldwide.

By participating in this project, you agree to abide by our Code of Conduct.

---

## Table of Contents
1. [How Can I Contribute?](#how-can-i-contribute)
   - [Reporting Bugs](#reporting-bugs)
     - [How Do I Submit a Good Bug Report?](#how-do-i-submit-a-good-bug-report)
   - [Suggesting Enhancements](#suggesting-enhancements)
     - [How Do I Submit a Good Enhancement Suggestion?](#how-do-i-submit-a-good-enhancement-suggestion)
   - [Pull Requests](#pull-requests)
2. [Styleguides](#styleguides)
   - [Git Commit Messages](#git-commit-messages)
   - [JavaScript Styleguide](#javascript-styleguide)
   - [CSS Styleguide](#css-styleguide)
3. [Release Management](#release-management)

---

## How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report for EduReach. Following these guidelines helps maintainers and contributors understand your report, reproduce the behavior, and find related bugs.

#### How Do I Submit a Good Bug Report?
* **Use the Bug Report Template** in the GitHub Issue section.
* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps** which reproduce the problem in as many details as possible.
* **Provide specific examples** to demonstrate the steps.
* **Describe the behavior you observed** after following the steps and point out what exactly is the problem.
* **Explain which behavior you expected to see instead** and why.
* **Include screenshots or animated GIFs** if possible.
* **State details about your environment**: Browser name and version, OS name and version, and WebGPU availability (via `chrome://gpu` or console logs).

### Suggesting Enhancements
This section guides you through submitting an enhancement suggestion for EduReach, including completely new features and minor improvements.

#### How Do I Submit a Good Enhancement Suggestion?
* **Use the Feature Request Template**.
* **Use a clear and descriptive title** for the issue.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Provide specific examples to demonstrate the steps.**
* **Describe the current behavior and explain which behavior you expected to see instead** and why this would be useful.
* **Explain why this enhancement would be useful** to EduReach users (especially in offline/low-resource environments).

### Pull Requests
Please follow these steps to submit your contributions:
1. **Fork the repository** and clone your fork locally.
2. **Create a branch** for your edits (`git checkout -b feature/AmazingFeature` or `git checkout -b bugfix/FixBrokenThing`).
3. **Install dependencies** using `npm install` and verify the project runs locally using `npm run dev`.
4. **Make your changes**, keeping them as modular and focused as possible.
5. **Ensure the project builds** successfully using `npm run build`.
6. **Commit your changes** using clean commit messages (see Styleguides below).
7. **Push to your fork** and submit a Pull Request (PR) to the `main` branch.
8. **Fill out the Pull Request template** completely.

---

## Styleguides

### Git Commit Messages
* Use the present tense ("Add feature" not "Added feature").
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
* Limit the first line to 72 characters or less.
* Reference issues and pull requests liberally after the first line.

### JavaScript Styleguide
* Use ES6+ features where appropriate (e.g., arrow functions, destructuring, template literals).
* All imports must be defined clearly at the top of the file.
* Keep UI logic modularized within the `src/components` directory.
* Avoid direct global scope pollution; use exports and module state.

### CSS Styleguide
* Use Vanilla CSS custom variables for themes, colors, and transitions.
* Follow the established design system tokens in `src/style.css`.
* Ensure layout classes are responsive for mobile, tablet, and desktop views.

---

## Release Management

EduReach follows [Semantic Versioning (SemVer)](https://semver.org/). Releases are managed through GitHub Releases:
* **Patch releases (1.0.x)**: For bug fixes and minor optimizations that do not change functionality.
* **Minor releases (1.x.0)**: For new features or significant components (e.g. new AI personas or new course exporter tools).
* **Major releases (x.0.0)**: For breaking changes or complete architectural updates.
