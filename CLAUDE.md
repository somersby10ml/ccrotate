# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ccrotate` is a CLI tool for managing multiple Claude accounts to handle rate limits. It allows users to save, switch between, and rotate Claude account credentials seamlessly.

## Architecture

The project follows a simple Node.js CLI architecture:

- **Entry Point**: `bin/ccrotate.js` - Main CLI interface using Commander.js
- **Core Logic**: `lib/ccrotate.js` - CCRotate class containing all functionality
- **Module Export**: `index.js` - Simple module export for programmatic use

### Key Components

- **CCRotate Class** (`lib/ccrotate.js`): Core functionality for account management
  - Manages profiles in `~/.ccrotate/profiles.json`
  - Interacts with Claude's config files (`~/.claude/.credentials.json`, `~/.claude.json`)
  - Implements atomic file operations for safe credential switching

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

**Test the CLI locally:**
```bash
node bin/ccrotate.js --help
```

**Install globally for testing:**
```bash
npm install -g .
```

## Key CLI Commands

- `ccrotate snap [--force]` - Save current account information
- `ccrotate list` (alias: `ls`) - Show saved accounts with current account indicator
- `ccrotate switch <email>` - Switch to specific account
- `ccrotate next` - Switch to next account in rotation
- `ccrotate remove <email>` (alias: `rm`) - Remove saved account

## File Structure

- `~/.ccrotate/profiles.json` - Stored account profiles (created by tool)
- `~/.claude/.credentials.json` - Claude credentials file (read/written)
- `~/.claude.json` - Claude config with OAuth account info (read/written)

## Dependencies

- `chalk` - Terminal colors and styling
- `commander` - CLI framework
- `prompts` - Interactive prompts for confirmations

## Important Implementation Details

- All file operations use atomic writing (temp file + rename) for safety
- Email addresses serve as unique identifiers for accounts
- The tool maintains compatibility with `claude-code`'s authentication system
- Error handling provides user-friendly messages for common scenarios
- Profiles include `lastUsed` timestamp for rotation logic