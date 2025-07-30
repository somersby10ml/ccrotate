import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import prompts from 'prompts';
import { spawn, execSync } from 'child_process';
import React from 'react';
import { render } from 'ink';
import AccountsList from './components/AccountsList.js';
import RefreshView from './components/RefreshView.js';

class CCRotate {
  constructor() {
    this.profilesDir = path.join(os.homedir(), '.ccrotate');
    this.profilesFile = path.join(this.profilesDir, 'profiles.json');
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.credentialsFile = path.join(this.claudeDir, '.credentials.json');
    this.claudeConfigFile = path.join(os.homedir(), '.claude.json');
    this.claudePath = null;
  }

  findClaudePath() {
    if (this.claudePath) {
      return this.claudePath;
    }

    try {
      const platform = os.platform();
      let command;
      
      if (platform === 'win32') {
        command = 'where claude';
      } else {
        command = 'which claude';
      }
      
      const result = execSync(command, { encoding: 'utf8', timeout: 5000 }).trim();
      
      if (result) {
        this.claudePath = result.split('\n')[0];
        return this.claudePath;
      }
    } catch (error) {
      // Fall back to default if command execution fails
    }
    
    return 'claude';
  }

  formatExpiresAt(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      // Convert to KST (UTC+9)
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      
      const year = kstDate.getUTCFullYear();
      const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(kstDate.getUTCDate()).padStart(2, '0');
      const hour = String(kstDate.getUTCHours()).padStart(2, '0');
      const minute = String(kstDate.getUTCMinutes()).padStart(2, '0');
      const second = String(kstDate.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    } catch (error) {
      return 'Invalid';
    }
  }

  ensureProfilesDir() {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  loadProfiles() {
    if (!fs.existsSync(this.profilesFile)) {
      return {};
    }
    
    try {
      const data = fs.readFileSync(this.profilesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse profiles.json: ${error.message}`);
    }
  }

  saveProfiles(profiles) {
    this.ensureProfilesDir();
    
    try {
      const tempFile = this.profilesFile + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(profiles, null, 2), 'utf8');
      fs.renameSync(tempFile, this.profilesFile);
    } catch (error) {
      throw new Error(`Failed to save profiles: ${error.message}`);
    }
  }

  getCurrentAccount() {
    if (!fs.existsSync(this.credentialsFile)) {
      throw new Error('No active Claude account found. Please login with claude-code first.');
    }

    if (!fs.existsSync(this.claudeConfigFile)) {
      throw new Error('Claude config file not found. Please login with claude-code first.');
    }

    try {
      const credentials = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
      const config = JSON.parse(fs.readFileSync(this.claudeConfigFile, 'utf8'));
      
      if (!config.oauthAccount || !config.oauthAccount.emailAddress) {
        throw new Error('No OAuth account information found in Claude config.');
      }

      return {
        email: config.oauthAccount.emailAddress,
        credentials,
        userId: config.userId,
        oauthAccount: config.oauthAccount
      };
    } catch (error) {
      throw new Error(`Failed to read current account: ${error.message}`);
    }
  }

  writeClaudeFiles(accountData) {
    try {
      const credentialsTemp = this.credentialsFile + '.tmp';
      const configTemp = this.claudeConfigFile + '.tmp';

      fs.writeFileSync(credentialsTemp, JSON.stringify(accountData.credentials, null, 2), 'utf8');
      
      const currentConfig = fs.existsSync(this.claudeConfigFile) 
        ? JSON.parse(fs.readFileSync(this.claudeConfigFile, 'utf8'))
        : {};
      
      const newConfig = {
        ...currentConfig,
        userId: accountData.userId,
        oauthAccount: accountData.oauthAccount
      };
      
      fs.writeFileSync(configTemp, JSON.stringify(newConfig, null, 2), 'utf8');

      fs.renameSync(credentialsTemp, this.credentialsFile);
      fs.renameSync(configTemp, this.claudeConfigFile);
    } catch (error) {
      throw new Error(`Failed to write account files: ${error.message}`);
    }
  }

  async snap(force = false) {
    const currentAccount = this.getCurrentAccount();
    const profiles = this.loadProfiles();
    
    if (profiles[currentAccount.email] && !force) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Account ${currentAccount.email} already exists. Overwrite?`,
        initial: false
      });
      
      if (!response.overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    profiles[currentAccount.email] = {
      credentials: currentAccount.credentials,
      userId: currentAccount.userId,
      oauthAccount: currentAccount.oauthAccount,
      lastUsed: new Date().toISOString()
    };

    this.saveProfiles(profiles);
    console.log(chalk.green(`✓ Account ${currentAccount.email} saved successfully.`));
  }

  async list() {
    const profiles = this.loadProfiles();
    const emails = Object.keys(profiles);
    
    let currentEmail;
    try {
      const currentAccount = this.getCurrentAccount();
      currentEmail = currentAccount.email;
    } catch (error) {
      currentEmail = null;
    }

    const accounts = emails.map(email => {
      const profile = profiles[email];
      const lastUsed = new Date(profile.lastUsed).toLocaleDateString();
      
      let expiresAt = 'Unknown';
      try {
        if (profile.credentials && profile.credentials.claudeAiOauth && profile.credentials.claudeAiOauth.expiresAt) {
          expiresAt = this.formatExpiresAt(profile.credentials.claudeAiOauth.expiresAt);
        }
      } catch (error) {
        expiresAt = 'Invalid';
      }
      
      return {
        email,
        lastUsed,
        expiresAt
      };
    });

    const app = React.createElement(AccountsList, {
      accounts,
      currentEmail
    });

    render(app);
  }

  async switch(email) {
    const profiles = this.loadProfiles();
    
    if (!profiles[email]) {
      throw new Error(`Account ${email} not found. Run 'ccrotate list' to see available accounts.`);
    }

    const accountData = profiles[email];
    this.writeClaudeFiles(accountData);

    profiles[email].lastUsed = new Date().toISOString();
    this.saveProfiles(profiles);

    console.log(chalk.green(`✓ Switched to account: ${email}`));
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('  • Restart claude-code to apply account changes'));
    console.log(chalk.gray('  • To resume previous conversation: Use') + chalk.cyan(' /resume') + chalk.gray(' command'));
  }

  async next() {
    const profiles = this.loadProfiles();
    const emails = Object.keys(profiles);
    
    if (emails.length === 0) {
      throw new Error('No saved accounts found. Please add accounts first using `ccrotate snap`.');
    }

    if (emails.length === 1) {
      console.log(chalk.yellow('Only one account available. Nothing to switch to.'));
      return;
    }

    let currentEmail;
    try {
      const currentAccount = this.getCurrentAccount();
      currentEmail = currentAccount.email;
    } catch (error) {
      currentEmail = null;
    }

    let nextIndex = 0;
    if (currentEmail && profiles[currentEmail]) {
      const currentIndex = emails.indexOf(currentEmail);
      nextIndex = (currentIndex + 1) % emails.length;
    }

    const nextEmail = emails[nextIndex];
    
    console.log(chalk.blue(`Switching: ${currentEmail || 'unknown'} -> ${nextEmail}`));
    await this.switch(nextEmail);
  }

  async remove(email) {
    const profiles = this.loadProfiles();
    
    if (!profiles[email]) {
      throw new Error(`Account ${email} not found.`);
    }

    const response = await prompts({
      type: 'confirm',
      name: 'remove',
      message: `Are you sure you want to remove account ${email}?`,
      initial: false
    });
    
    if (!response.remove) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }

    delete profiles[email];
    this.saveProfiles(profiles);
    
    console.log(chalk.green(`✓ Account ${email} removed successfully.`));
  }

  backupCurrentCredentials() {
    const backup = {
      credentials: null,
      config: null
    };

    try {
      if (fs.existsSync(this.credentialsFile)) {
        backup.credentials = fs.readFileSync(this.credentialsFile, 'utf8');
      }
      if (fs.existsSync(this.claudeConfigFile)) {
        backup.config = fs.readFileSync(this.claudeConfigFile, 'utf8');
      }
    } catch (error) {
      throw new Error(`Failed to backup current credentials: ${error.message}`);
    }

    return backup;
  }

  restoreCredentials(backup) {
    try {
      if (backup.credentials && fs.existsSync(this.credentialsFile)) {
        fs.writeFileSync(this.credentialsFile, backup.credentials, 'utf8');
      }
      if (backup.config && fs.existsSync(this.claudeConfigFile)) {
        fs.writeFileSync(this.claudeConfigFile, backup.config, 'utf8');
      }
    } catch (error) {
      throw new Error(`Failed to restore credentials: ${error.message}`);
    }
  }

  async testAccount() {
    return new Promise((resolve) => {
      const claudePath = this.findClaudePath();
      const child = spawn(claudePath, ['-p', 'Hi'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      child.stdin.end();

      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          status: 'error',
          response: 'Command timeout after 30 seconds'
        });
      }, 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          resolve({
            status: 'error',
            response: (output || 'Command failed').substring(0, 50) + '...'
          });
          return;
        }

        const response = output.trim();
        if (response.length === 0) {
          resolve({
            status: 'error',
            response: 'No response received'
          });
          return;
        }

        resolve({
          status: 'success',
          response: response.substring(0, 50) + (response.length > 50 ? '...' : '')
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          status: 'error',
          response: error.message.substring(0, 50) + '...'
        });
      });
    });
  }

  async refresh() {
    const profiles = this.loadProfiles();
    const emails = Object.keys(profiles);
    
    if (emails.length === 0) {
      throw new Error('No saved accounts found. Please add accounts first using `ccrotate snap`.');
    }

    const originalBackup = this.backupCurrentCredentials();
    const accounts = emails.map(email => ({ email }));
    
    return new Promise((resolve) => {
      const testAccount = async (email) => {
        try {
          const accountData = profiles[email];
          this.writeClaudeFiles(accountData);
          
          const testResult = await this.testAccount(email);
          return testResult;
        } catch (error) {
          return {
            status: 'error',
            response: error.message.substring(0, 50) + '...'
          };
        }
      };

      const onComplete = () => {
        this.restoreCredentials(originalBackup);
        resolve();
      };

      const app = React.createElement(RefreshView, {
        accounts,
        onTestAccount: testAccount,
        onComplete
      });

      render(app);
    });
  }
}

export default CCRotate;