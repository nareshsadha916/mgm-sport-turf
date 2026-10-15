const { execSync } = require('child_process');
const path = require('path');

const git = path.join(
  process.env.LOCALAPPDATA,
  'Microsoft',
  'WinGet',
  'Packages',
  'Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'cmd',
  'git.exe'
);

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: __dirname, encoding: 'utf-8' });
    console.log(out);
    return out;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.stdout) console.log(`stdout: ${err.stdout}`);
    if (err.stderr) console.error(`stderr: ${err.stderr}`);
    return null;
  }
}

console.log('Using git binary:', git);
run(`"${git}" init`);
run(`"${git}" config user.name "nareshsadha916"`);
run(`"${git}" config user.email "nareshsadha916@users.noreply.github.com"`);
run(`"${git}" branch -M main`);
run(`"${git}" add .`);
run(`"${git}" commit -m "Initial commit: MGM SPORT Turf Booking Platform with Render cloud support"`);
run(`"${git}" status`);
