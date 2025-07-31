import chalk from 'chalk';
import prompts from 'prompts';
import msgpack from 'msgpack-lite';
import { gunzipSync } from 'zlib';
import { createHash } from 'crypto';
import fs from 'fs';

export class ImportCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  // Restore optimized profiles to original structure
  restoreProfiles(optimized) {
    const restored = {};
    
    for (const [email, profile] of Object.entries(optimized)) {
      restored[email] = {
        credentials: {
          claudeAiOauth: {
            accessToken: profile.c.a,
            refreshToken: profile.c.r,
            expiresAt: profile.c.e,
            scopes: profile.c.s,
            subscriptionType: profile.c.t
          }
        },
        oauthAccount: {
          accountUuid: profile.o.u,
          emailAddress: profile.o.e,
          organizationUuid: profile.o.g,
          organizationRole: profile.o.r,
          workspaceRole: profile.o.w,
          organizationName: profile.o.n
        },
        lastUsed: profile.l
      };
    }
    
    return restored;
  }

  async execute(compressedData) {
    if (!compressedData) {
      throw new Error('No compressed data provided. Usage: ccrotate import <compressed-data>');
    }

    // Remove surrounding quotes if present
    let cleanData = compressedData.trim();
    if ((cleanData.startsWith('"') && cleanData.endsWith('"')) || 
        (cleanData.startsWith("'") && cleanData.endsWith("'"))) {
      cleanData = cleanData.slice(1, -1);
    }

    // Check for mp-gz-b64: prefix
    if (!cleanData.startsWith('mp-gz-b64:')) {
      throw new Error('Invalid data format. Expected mp-gz-b64: prefix.');
    }
    
    const dataWithCrc = cleanData.slice('mp-gz-b64:'.length);
    
    // Separate CRC32 hash and data
    const colonIndex = dataWithCrc.indexOf(':');
    if (colonIndex === -1) {
      throw new Error('Invalid data format. Missing CRC hash.');
    }
    
    const expectedCrc = dataWithCrc.slice(0, colonIndex);
    const encodedData = dataWithCrc.slice(colonIndex + 1);
    
    if (expectedCrc.length !== 8) {
      throw new Error('Invalid CRC hash format. Expected 8 characters.');
    }

    let profiles;
    try {
      // Step 1: Base64 decoding
      const decoded = Buffer.from(encodedData, 'base64');
      
      // Step 2: Gzip decompression
      const decompressed = gunzipSync(decoded);
      
      // Step 3: MessagePack decoding
      const optimized = msgpack.decode(decompressed);
      
      // Step 4: Restore to original structure
      profiles = this.restoreProfiles(optimized);
      
      // Step 5: CRC32 verification (based on restored original file, sorted keys)
      const sortedProfiles = Object.keys(profiles).sort().reduce((sorted, key) => {
        sorted[key] = profiles[key];
        return sorted;
      }, {});
      const sortedJson = JSON.stringify(sortedProfiles);
      const actualCrc = createHash('md5').update(sortedJson).digest('hex').slice(0, 8);
      
      if (actualCrc !== expectedCrc) {
        throw new Error(`CRC verification failed. Expected: ${expectedCrc}, Got: ${actualCrc}. Data may be corrupted.`);
      }
      
      console.log(chalk.green(`✓ CRC verification passed: ${actualCrc}`));
      
    } catch (error) {
      throw new Error(`Failed to parse imported data: ${error.message}`);
    }

    // Validate the structure
    if (typeof profiles !== 'object' || profiles === null) {
      throw new Error('Invalid profile data structure.');
    }

    // Validate each profile has required fields
    for (const [email, profile] of Object.entries(profiles)) {
      if (!profile.credentials?.claudeAiOauth || !profile.oauthAccount) {
        throw new Error(`Invalid profile structure for ${email}. Missing required fields.`);
      }
      if (!profile.oauthAccount.emailAddress) {
        throw new Error(`Invalid OAuth account structure for ${email}.`);
      }
    }

    const accountCount = Object.keys(profiles).length;
    const accountList = Object.keys(profiles).join(', ');

    console.log(chalk.blue(`Found ${accountCount} accounts to import:`));
    console.log(chalk.dim(accountList));
    console.log();

    // Check if existing file exists (without reading it)
    if (fs.existsSync(this.ccrotate.profilesFile)) {
      console.log(chalk.yellow(`Warning: This will replace existing profile data.`));
    }

    const response = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Do you want to proceed with the import?',
      initial: false
    });

    if (!response.proceed) {
      console.log(chalk.yellow('Import cancelled.'));
      return;
    }

    try {
      this.ccrotate.saveProfiles(profiles);
      console.log(chalk.green(`✓ Successfully imported ${accountCount} accounts.`));
    } catch (error) {
      throw new Error(`Failed to save imported profiles: ${error.message}`);
    }
  }
}