#!/usr/bin/env node

/**
 * 自动版本号管理脚本
 * 功能：在每次提交时自动增加版本号
 * 使用方式：npm run bump [patch|minor|major]
 *   patch: 0.1.0 -> 0.1.1 (默认，补丁版本)
 *   minor: 0.1.0 -> 0.2.0 (次版本)
 *   major: 0.1.0 -> 1.0.0 (主版本)
 */

const fs = require('fs');
const path = require('path');

// 获取当前版本号
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  return packageJson.version;
}

// 解析版本号
function parseVersion(version) {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
    patch: parseInt(parts[2], 10)
  };
}

// 增加版本号
function bumpVersion(currentVersion, type = 'patch') {
  const parsed = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      break;
    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      break;
    case 'patch':
    default:
      parsed.patch += 1;
      break;
  }
  
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

// 更新 package.json
function updatePackageJson(newVersion) {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  return newVersion;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0] || 'patch'; // 默认 patch
  
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('无效的版本类型！使用: patch, minor, 或 major');
    process.exit(1);
  }
  
  try {
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, bumpType);
    
    console.log(`版本更新: ${currentVersion} -> ${newVersion}`);
    
    updatePackageJson(newVersion);
    
    console.log('✅ package.json 已更新');
  } catch (error) {
    console.error('❌ 版本更新失败:', error.message);
    process.exit(1);
  }
}

main();
