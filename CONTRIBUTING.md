# Contributing to Murma

Thank you for contributing to Murma! This guide explains how to develop locally, follow our standards, and add dependencies responsibly.

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
npm run test:watch

# Lint code
npm run lint

# Build for production
npm run build
```

## Code Standards

- **TypeScript**: Full type coverage required
- **Linting**: `npm run lint` must pass (ESLint)
- **Testing**: Write tests for new features
- **Formatting**: Use Tailwind CSS for styling

## Adding New Dependencies

### Before You Install

Always check the license of any new package you're considering. Murma uses only permissive, open-source licenses.

### Approved Licenses

We **only accept** packages with these licenses:
- ✅ MIT
- ✅ Apache-2.0
- ✅ BSD-3-Clause
- ✅ ISC
- ✅ OFL-1.1

We **explicitly reject**:
- ❌ GPL (v2, v3)
- ❌ AGPL
- ❌ SSPL
- ❌ EUPL

### How to Add a Dependency

1. **Check the package license** before installing:
   ```bash
   npm view <package-name> license
   ```

2. **Install the package**:
   ```bash
   npm install <package-name>
   ```

3. **Verify license compliance**:
   ```bash
   npm run license-check
   ```
   This should pass with no errors.

4. **Commit your changes**:
   ```bash
   git add package.json package-lock.json
   git commit -m "Add <package-name> dependency"
   ```

5. **Push and create a PR**:
   The GitHub Actions license check will automatically verify your new dependency.

### If License Check Fails

If a package has a restrictive or GPL license:

1. **Do not add it** - Most of the time, there's a permissive alternative available
2. **Search for alternatives** - Tools like [Libraries.io](https://libraries.io/) can help find alternatives
3. **Ask the team** - If you believe an exception is necessary, open a discussion in your PR

### Common License Issues

**I see "No license" for a package**
- The package author may not have declared a license
- Check the repository (usually on GitHub) for LICENSE file
- Ask the maintainer or file an issue on their repository
- Consider using a different, better-maintained package

**The package has dual licensing**
- Some packages offer multiple license options
- npm will show one, but the package may support others
- Check the package's LICENSE file to see all options
- If one option is permissive (MIT, Apache 2.0), it's acceptable

**A package is LGPL**
- LGPL is acceptable only if it's LGPL-2.1 with exceptions
- Generally not recommended - consider MIT/Apache alternatives
- Discuss with team before using

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linter: `npm run lint`
6. Run license check: `npm run license-check`
7. Commit with clear messages
8. Push and create a Pull Request
9. Address any review feedback

## License Compliance

Murma is committed to using only permissive, commercial-friendly licenses. This allows us to:
- ✅ Use Murma in commercial products
- ✅ Create proprietary derivatives if needed
- ✅ Avoid GPL restrictions
- ✅ Maintain vendor independence

See [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md) for details about our compliance approach.

## Security

For security vulnerabilities, please follow responsible disclosure practices:
1. **Do not** open a public issue
2. Email details to the maintainers (security policy coming soon)

## Questions?

- Check existing [issues](../../issues)
- Review [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md) for compliance details
- See [LICENSE_COMPLIANCE_REPORT.md](LICENSE_COMPLIANCE_REPORT.md) for technical details

## Code of Conduct

Be respectful and inclusive in all interactions. We aim to create a welcoming community for all contributors.

---

Thank you for making Murma better! 🎉
