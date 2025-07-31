# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ccrotate` is a CLI tool for managing multiple Claude accounts to handle rate limits. It allows users to save, switch between, and rotate Claude account credentials seamlessly.

## Architecture

The project follows a modern CLI architecture with optimized distribution:

### Development Structure
- **Entry Point**: `bin/ccrotate.js` - Main CLI interface using Commander.js
- **Core Logic**: `lib/ccrotate.js` - CCRotate class containing all functionality
- **Command Pattern**: `lib/commands/*.js` - Individual command implementations
- **Components**: `lib/components/*.js` - React Ink UI components
- **Utilities**: `lib/utils/*.js` - Helper functions and utilities

### Production Distribution
- **Single Executable**: `dist/cli.js` - Bundled CLI with all dependencies
- **Zero Dependencies**: Users install no additional packages
- **Build System**: esbuild for fast bundling and minification

### Key Components

- **CCRotate Class** (`lib/ccrotate.js`): Core functionality for account management
  - Manages profiles in `~/.ccrotate/profiles.json`
  - Interacts with Claude's config files (`~/.claude/.credentials.json`, `~/.claude.json`)
  - Implements atomic file operations for safe credential switching
  - Uses command pattern for better code organization

- **Command Classes** (`lib/commands/*.js`): Individual command implementations
  - `SnapCommand`: Save current account
  - `ListCommand`: Display accounts with React Ink UI  
  - `SwitchCommand`: Switch to specific account
  - `NextCommand`: Rotate to next account
  - `RemoveCommand`: Remove saved account
  - `RefreshCommand`: Test and refresh tokens
  - `ExportCommand`: Export profiles with compression
  - `ImportCommand`: Import profiles with CRC verification

- **UI Components** (`lib/components/*.js`): Interactive displays
  - `AccountsList`: Beautiful account listing with status indicators
  - `RefreshView`: Real-time account testing interface

### Data Flow

1. Account credentials are stored in `~/.ccrotate/profiles.json` as plain text JSON
2. Current active account data is read from `~/.claude/.credentials.json` and `~/.claude.json`
3. Account switching involves atomic file replacement using temporary files
4. Each account is identified by email address from `oauthAccount.emailAddress`

## Development Commands

**Install dependencies:**
```bash
pnpm install
```

**Development build (with sourcemap):**
```bash
pnpm run build:dev
```

**Production build (minified):**
```bash
pnpm run build
```

**Test the CLI locally (source):**
```bash
node bin/ccrotate.js --help
```

**Test the built CLI:**
```bash
./dist/cli.js --help
```

**Package testing:**
```bash
pnpm run publish:dist:dry
```

**Publish to npm:**
```bash
pnpm run publish:dist
```

## Key CLI Commands

- `ccrotate snap [--force]` - Save current account information
- `ccrotate list` (alias: `ls`) - Show saved accounts with current account indicator
- `ccrotate switch <email>` - Switch to specific account
- `ccrotate next` - Switch to next account in rotation
- `ccrotate remove <email>` (alias: `rm`) - Remove saved account
- `ccrotate refresh` (alias: `rf`) - Test all accounts and refresh tokens
- `ccrotate export` - Export all profiles as compressed string
- `ccrotate import <data>` - Import profiles from compressed string

## File Structure

- `~/.ccrotate/profiles.json` - Stored account profiles (created by tool)
- `~/.claude/.credentials.json` - Claude credentials file (read/written)
- `~/.claude.json` - Claude config with OAuth account info (read/written)

## Dependencies

### Runtime Dependencies (bundled in dist/cli.js)
- `chalk` - Terminal colors and styling
- `commander` - CLI framework
- `prompts` - Interactive prompts for confirmations
- `ink` + `react` - Interactive CLI components
- `msgpack-lite` - Efficient data compression for export/import

### Development Dependencies
- `esbuild` - Fast bundling and minification
- `vitest` - Testing framework
- `@vitest/ui` - Test UI interface

## Important Implementation Details

- All file operations use atomic writing (temp file + rename) for safety
- Email addresses serve as unique identifiers for accounts
- The tool maintains compatibility with `claude-code`'s authentication system
- Error handling provides user-friendly messages for common scenarios
- Profiles include `lastUsed` timestamp for rotation logic
- Export/import uses MessagePack + Gzip + Base64 for efficient compression
- CRC32 verification ensures data integrity during import
- Account testing uses actual claude calls to verify token validity
- Build system creates single executable with all dependencies bundled
- Distribution via `dist/` directory publishing (not root package.json)