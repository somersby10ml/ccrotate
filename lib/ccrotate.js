import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';
import { SnapCommand } from './commands/snap.js';
import { ListCommand } from './commands/list.js';
import { SwitchCommand } from './commands/switch.js';
import { NextCommand } from './commands/next.js';
import { RemoveCommand } from './commands/remove.js';
import { RefreshCommand } from './commands/refresh.js';
import { ExportCommand } from './commands/export.js';
import { ImportCommand } from './commands/import.js';

class CCRotate {
  constructor() {
    this.profilesDir = path.join(os.homedir(), '.ccrotate');
    this.profilesFile = path.join(this.profilesDir, 'profiles.json');
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.credentialsFile = path.join(this.claudeDir, '.credentials.json');
    this.claudeConfigFile = path.join(os.homedir(), '.claude.json');
    this.claudePath = null;
    
    // Initialize commands
    this.commands = {
      snap: new SnapCommand(this),
      list: new ListCommand(this),
      switch: new SwitchCommand(this),
      next: new NextCommand(this),
      remove: new RemoveCommand(this),
      refresh: new RefreshCommand(this),
      export: new ExportCommand(this),
      import: new ImportCommand(this)
    };
  }

  findClaudePath() {
    if (this.claudePath) {
      return this.claudePath;
    }

    // Step 1: Check common installation paths directly
    const commonPaths = [
      path.join(os.homedir(), '.claude/local/claude'),  // Official installation path
      '/usr/local/bin/claude',                          // macOS Homebrew
      '/opt/homebrew/bin/claude',                       // macOS ARM Homebrew  
      path.join(os.homedir(), 'bin/claude'),            // User bin
      '/usr/bin/claude'                                 // System-wide
    ];
    
    for (const claudePath of commonPaths) {
      try {
        if (fs.existsSync(claudePath) && fs.statSync(claudePath).mode & 0o111) {
          this.claudePath = claudePath;
          return claudePath;
        }
      } catch (error) {
        // Continue checking other paths
        continue;
      }
    }

    // Step 2: Try to find claude using user's shell environment
    try {
      const userShell = process.env.SHELL || '/bin/bash';
      const shellConfig = userShell.includes('zsh') ? '~/.zshrc' : 
                         userShell.includes('bash') ? '~/.bashrc' : 
                         '~/.profile';
      
      const platform = os.platform();
      const whichCommand = platform === 'win32' ? 'where claude' : 'which claude';
      
      const result = execSync(`source ${shellConfig} && ${whichCommand}`, {
        encoding: 'utf8',
        shell: userShell,
        env: process.env,
        timeout: 5000
      }).trim();
      
      if (result) {
        // Parse "claude: aliased to /path/to/claude" format
        const aliasMatch = result.match(/aliased to (.+)$/);
        if (aliasMatch) {
          const claudePath = aliasMatch[1].trim();
          if (fs.existsSync(claudePath)) {
            this.claudePath = claudePath;
            return claudePath;
          }
        }
        
        // Handle direct path result
        const directPath = result.split('\n')[0].trim();
        if (directPath && fs.existsSync(directPath)) {
          this.claudePath = directPath;
          return directPath;
        }
      }
    } catch (error) {
      // Continue to step 3
    }

    // Step 3: Check environment variable fallback
    if (process.env.CLAUDE_PATH) {
      const envPath = process.env.CLAUDE_PATH;
      try {
        if (fs.existsSync(envPath) && fs.statSync(envPath).mode & 0o111) {
          this.claudePath = envPath;
          return envPath;
        }
      } catch (error) {
        // Continue to error
      }
    }

    // Final fallback with helpful error message
    throw new Error(`Claude executable not found. Please try:
1. Reinstall claude-code: npm install -g @anthropic/claude-code
2. Set custom path: export CLAUDE_PATH="/path/to/claude"
3. Check installation: which claude`);
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
    return this.commands.snap.execute(force);
  }

  async list() {
    return this.commands.list.execute();
  }

  async switch(email) {
    return this.commands.switch.execute(email);
  }

  async next() {
    return this.commands.next.execute();
  }

  async remove(email) {
    return this.commands.remove.execute(email);
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

  async testAccount(email) {
    return new Promise((resolve) => {
      const claudePath = this.findClaudePath();

      const command = `${claudePath} -p "Only say Hi" --model sonnet`;
      const child = spawn(command, {
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
          response: 'Command timeout after 30 seconds',
          credentialsUpdated: false
        });
      }, 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        // Check if credentials were updated after Claude execution
        const credentialsUpdated = this.checkAndUpdateProfile(email);
        
        if (code !== 0) {
          resolve({
            status: 'error',
            response: (output || 'Command failed').substring(0, 150),
            credentialsUpdated
          });
          return;
        }

        const response = output.trim();
        if (response.length === 0) {
          resolve({
            status: 'error',
            response: 'No response received',
            credentialsUpdated
          });
          return;
        }

        resolve({
          status: 'success',
          response: response.substring(0, 150),
          credentialsUpdated
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          status: 'error',
          response: error.message.substring(0, 150),
          credentialsUpdated: false
        });
      });
    });
  }

  checkAndUpdateProfile(email) {
    try {
      const profiles = this.loadProfiles();
      if (!profiles[email]) {
        return false;
      }

      // Get current credentials from Claude files
      const currentCredentials = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
      const currentConfig = JSON.parse(fs.readFileSync(this.claudeConfigFile, 'utf8'));

      const storedProfile = profiles[email];
      
      // Compare credentials to check for updates
      const credentialsChanged = JSON.stringify(storedProfile.credentials) !== JSON.stringify(currentCredentials);
      const configChanged = JSON.stringify(storedProfile.oauthAccount) !== JSON.stringify(currentConfig.oauthAccount) ||
                           storedProfile.userId !== currentConfig.userId;

      if (credentialsChanged || configChanged) {
        // Update the profile with new credentials
        profiles[email] = {
          ...storedProfile,
          credentials: currentCredentials,
          userId: currentConfig.userId,
          oauthAccount: currentConfig.oauthAccount,
          lastUsed: new Date().toISOString()
        };

        this.saveProfiles(profiles);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking profile update for ${email}:`, error.message);
      return false;
    }
  }

  async refresh() {
    return this.commands.refresh.execute();
  }

  async export() {
    return this.commands.export.execute();
  }

  async import(compressedData) {
    return this.commands.import.execute(compressedData);
  }
}

export default CCRotate;