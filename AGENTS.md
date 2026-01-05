# Agent Guidelines for aether-mailer

## Commands
- **Build**: `pnpm build` (Next.js production build)
- **Lint**: `pnpm lint` (ESLint with Next.js rules)
- **Dev**: `pnpm dev` (Next.js development server)
- **Test**: No test framework configured yet

## Code Style

### General Guidelines
- **Naming**: 
  - camelCase for variables/functions, PascalCase for components and types
  - snake_case for Python variables/functions, UpperCamelCase for classes
  - snake_case or camelCase for Go exported variables/functions (use Go conventions)
  - snake_case for Rust variables/functions, UpperCamelCase for structs/enums
- **Error Handling**: Use try/catch for async operations in JS/TS, handle errors explicitly in Go (`if err != nil`), Python (`try/except`), and Rust (`Result` / `Option`)
- **Comments**: Docstrings for Python, doc comments (`///`) for Rust, JSDoc for JS/TS
- **Imports/Dependencies**:
  - Use named imports in JS/TS
  - Keep Go imports organized (`goimports` format)
  - Python: use standard library first, then external packages, then local modules
  - Rust: follow `rustfmt` and group external crates at the top
- **Testing**:
  - JS/TS: Jest / Testing Library recommended
  - Go: `testing` package
  - Python: pytest
  - Rust: built-in `#[cfg(test)]` module

### JavaScript/Node.js
- **Framework**: Next.js 16 with React 19, TypeScript strict mode
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Components**: Functional components with proper TypeScript typing
- **Linting/Formatting**: ESLint + Prettier

### Go
- **Formatting**: `gofmt` or `go fmt` mandatory
- **Linting**: `golangci-lint`
- **Modules**: Use Go modules, avoid vendoring unless necessary
- **Error Handling**: Always check `err != nil`, return errors instead of panicking unless unrecoverable
- **Concurrency**: Use goroutines carefully, prefer context propagation for cancellation

### Python
- **Formatting**: `black` for code, `isort` for imports
- **Linting**: `flake8` or `pylint`
- **Typing**: Use type hints where possible
- **Virtual Environment**: `venv` or `poetry` recommended
- **Error Handling**: Catch specific exceptions, avoid bare `except`

### Rust
- **Formatting**: `rustfmt`
- **Linting**: `clippy`
- **Error Handling**: Prefer `Result`/`Option`, use `?` operator for propagation
- **Modules**: Keep module tree clear and explicit
- **Ownership**: Follow Rust ownership/borrowing best practices

## File Structure
- `app/` directory for Next.js App Router
- `public/` for static assets
- Root-level config files (eslint.config.mjs, tsconfig.json, etc.)
- Go: package per directory, `main.go` at root if executable
- Python: package per module, `__init__.py` in packages
- Rust: `src/` directory with `main.rs` or `lib.rs`

## Commits
- **Message Format**:
feat(app): example phrase

- description

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope**: always include the affected module/app if applicable
- **Description**: concise, imperative, lowercase first word
- **Body**: optional, use bullet points for details

## Accessibility & UX
- Semantic HTML, proper alt texts
- Keyboard navigation support
- Dark mode: `dark:` prefixes and CSS variables
- Fonts: Google Fonts (Geist Sans/Mono) via CSS variables