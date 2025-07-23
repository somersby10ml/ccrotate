# 🔄 ccrotate

> **Seamlessly rotate between multiple Claude accounts to bypass rate limits**

A powerful CLI tool designed for `claude-code` users who need to manage multiple Claude accounts efficiently. Say goodbye to rate limit frustrations! 🚀

[![npm version](https://badge.fury.io/js/ccrotate.svg)](https://badge.fury.io/js/ccrotate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)

## ✨ Features

- 🔀 **Smart Account Rotation** - Switch between accounts with a single command
- 📸 **Snapshot Management** - Save your current Claude session instantly
- 🎯 **Intelligent Switching** - Automatic next-account detection with fallback
- 💾 **Safe Storage** - Atomic file operations prevent data corruption
- 🎨 **Beautiful CLI** - Colorful, intuitive interface with clear feedback
- ⚡ **Lightning Fast** - Quick account switches without losing context

## 🚀 Quick Start

### Installation

```bash
npm install -g ccrotate
```

### Basic Usage

1. **Login to your first Claude account** using `claude-code`
2. **Save your account**: `ccrotate snap`
3. **Login to another account** and repeat step 2
4. **Start rotating**: `ccrotate next` or `ccrotate switch user@example.com`

## 📖 Commands

### 📸 `ccrotate snap [--force]`
Save your currently active Claude account credentials.

```bash
ccrotate snap              # Save with confirmation prompt
ccrotate snap --force      # Force save without confirmation
```

### 📋 `ccrotate list` (alias: `ls`)
Display all saved accounts with status indicators.

```bash
ccrotate list
# Output:
# Saved Accounts:
# ★ 1. user1@example.com (last used: 1/15/2024)
#   2. user2@example.com (last used: 1/14/2024)
```

### 🔄 `ccrotate switch <email>`
Switch to a specific account by email address.

```bash
ccrotate switch user2@example.com
# ✓ Switched to account: user2@example.com
```

### ⏭️ `ccrotate next`
Rotate to the next account in your saved list.

```bash
ccrotate next
# Switching: user1@example.com -> user2@example.com
# ✓ Switched to account: user2@example.com
```

### 🗑️ `ccrotate remove <email>` (alias: `rm`)
Remove a saved account from your rotation.

```bash
ccrotate remove user@example.com
# ? Are you sure you want to remove account user@example.com? No / Yes
```

## 🏗️ How It Works

ccrotate manages your Claude accounts by:

1. **Reading** current credentials from `~/.claude/.credentials.json` and `~/.claude.json`
2. **Storing** account profiles in `~/.ccrotate/profiles.json`
3. **Switching** accounts using atomic file operations for safety
4. **Identifying** accounts by email from `oauthAccount.emailAddress`

### Data Structure

```json
{
  "user1@example.com": {
    "credentials": { /* Full credentials.json content */ },
    "userId": "user-id-here",
    "oauthAccount": { 
      "emailAddress": "user1@example.com",
      /* Other OAuth info */
    },
    "lastUsed": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Requirements

- **Node.js** 14.0.0 or higher
- **claude-code** CLI tool installed and configured
- **Windows** or **Linux** (macOS support coming soon!)

## ⚠️ Important Notes

- **Account Safety**: This tool works with session-based tokens. Please be mindful of Claude's terms of service.
- **Data Security**: Credentials are stored in plain text, consistent with `claude-code`'s approach.
- **Backup Recommended**: Consider backing up your `~/.ccrotate/` directory.

## 🛠️ Development

```bash
# Clone and install
git clone https://github.com/somersby10ml/ccrotate.git
cd ccrotate
npm install

# Test locally
node bin/ccrotate.js --help

# Install globally for testing
npm install -g .
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

If ccrotate helps you manage your Claude accounts better, consider:
- ⭐ Starring this repository
- 🐛 Reporting issues on [GitHub](https://github.com/somersby10ml/ccrotate/issues)
- 💡 Suggesting new features

---

<div align="center">
  <strong>Made with ❤️ for the Claude community</strong>
</div>