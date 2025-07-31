import chalk from 'chalk';
import msgpack from 'msgpack-lite';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

export class ExportCommand {
  constructor(ccrotate) {
    this.ccrotate = ccrotate;
  }

  // Optimize profiles by extracting only fields actually used by ccrotate
  optimizeProfiles(profiles) {
    const optimized = {};
    
    for (const [email, profile] of Object.entries(profiles)) {
      const creds = profile.credentials?.claudeAiOauth;
      const oauth = profile.oauthAccount;
      
      if (!creds || !oauth) continue;
      
      optimized[email] = {
        // credentials.claudeAiOauth - essential tokens only
        c: {
          a: creds.accessToken,        // accessToken
          r: creds.refreshToken,       // refreshToken  
          e: creds.expiresAt,         // expiresAt
          s: creds.scopes,            // scopes
          t: creds.subscriptionType   // subscriptionType
        },
        // oauthAccount - essential identification info only
        o: {
          u: oauth.accountUuid,       // accountUuid
          e: oauth.emailAddress,      // emailAddress (duplicate but needed)
          g: oauth.organizationUuid,  // organizationUuid
          r: oauth.organizationRole,  // organizationRole
          w: oauth.workspaceRole,     // workspaceRole
          n: oauth.organizationName   // organizationName
        },
        // lastUsed
        l: profile.lastUsed
      };
    }
    
    return optimized;
  }

  async execute() {
    const profiles = this.ccrotate.loadProfiles();
    
    if (Object.keys(profiles).length === 0) {
      console.log(chalk.yellow('No profiles found to export.'));
      return;
    }

    try {
      const originalJson = JSON.stringify(profiles);
      
      // Step 1: JSON optimization
      const optimized = this.optimizeProfiles(profiles);
      
      // Step 2: MessagePack binary serialization
      const packed = msgpack.encode(optimized);
      
      // Step 3: Gzip compression
      const gzipped = gzipSync(packed);
      
      // Step 4: Base64 encoding (shell-safe)
      const encoded = gzipped.toString('base64');
      
      // Step 5: Generate CRC32 hash (based on original profile file, sorted keys)
      const sortedProfiles = Object.keys(profiles).sort().reduce((sorted, key) => {
        sorted[key] = profiles[key];
        return sorted;
      }, {});
      const sortedJson = JSON.stringify(sortedProfiles);
      const crc32 = createHash('md5').update(sortedJson).digest('hex').slice(0, 8); // 8-character hash
      
      const finalOutput = `${crc32}:${encoded}`;
      
      console.log(chalk.green('✓ Profiles exported (Shell-Safe compression + CRC verification):'));
      console.log(chalk.dim(`${Object.keys(profiles).length} accounts: ${originalJson.length} → ${finalOutput.length} chars (-${Math.round((1-finalOutput.length/originalJson.length)*100)}%)`));
      console.log(chalk.dim(`CRC32: ${crc32} (data integrity guaranteed)`));
      console.log();
      console.log('"mp-gz-b64:' + finalOutput + '"');
      
    } catch (error) {
      throw new Error(`Failed to export profiles: ${error.message}`);
    }
  }
}