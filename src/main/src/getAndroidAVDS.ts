import { exec, execSync, spawn, spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export interface IAVD {
  name: string;
  path: string;
  target: string;
  screenshotPath?: string;
}

export function startAvd(avdName: string): void {
  // emulator -avd Pixel_3_XL_API_30
  const androidSdkPath = process.env['ANDROID_HOME'] || process.env['ANDROID_SDK_ROOT'];
  if (!androidSdkPath) return;

  const emulatorCmd = join(
    androidSdkPath,
    'emulator',
    `emulator${process.platform == 'win32' ? '.exe' : ''}`
  );
  const avdHome = process.env['ANDROID_AVD_HOME'];
  if (!avdHome) return;
  if (!existsSync(emulatorCmd)) return;

  exec(`${emulatorCmd}  -avd ${avdName}`);
}

export default function getAndroidAVDS(): IAVD[] {
  const androidSdkPath = process.env['ANDROID_HOME'] || process.env['ANDROID_SDK_ROOT'];
  if (!androidSdkPath) return [];

  const emulatorCmd = join(
    androidSdkPath,
    'emulator',
    `emulator${process.platform == 'win32' ? '.exe' : ''}`
  );
  const avdHome = process.env['ANDROID_AVD_HOME'];
  if (!avdHome) return [];
  if (!existsSync(emulatorCmd)) return [];

  const avdNames = execSync(`${emulatorCmd} -list-avds`)
    .toString()
    .replace(/\r/g, '')
    .split('\n')
    .filter((str) => !!str);

  const avdInis = readdirSync(avdHome).filter((fileName) => fileName.endsWith('.ini'));

  const avds = avdInis.map((ini) => {
    const contents = readFileSync(join(avdHome, ini))
      .toString()
      .trim()
      .replace(/\r/g, '')
      .split('\n');

    let path = contents.filter((line) => line.startsWith('path='))[0].replace('path=', '');
    let target = contents.filter((line) => line.startsWith('target='))[0].replace('target=', '');
    let name = ini.replace('.ini', '');
    let screenshotPath = '';
    if (existsSync(join(path, 'snapshots', 'default_boot', 'screenshot.png'))) {
      screenshotPath = Buffer.from(
        readFileSync(join(path, 'snapshots', 'default_boot', 'screenshot.png'))
      ).toString('base64');
    }

    return <IAVD>{
      name,
      target,
      path,
      screenshotPath
    };
  });

  return avds;
}
