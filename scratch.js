const fs = require('fs');

let findings = [];
let dependencies = [];

function loadJSON(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch(e) {
    console.error(`Error reading ${filepath}:`, e);
  }
  return null;
}

// 1. Parse Semgrep
const semgrepData = loadJSON('semgrep-results.json');
if (semgrepData && semgrepData.results) {
  semgrepData.results.forEach((r, i) => {
    findings.push({
      ID: `SAST-${(i+1).toString().padStart(3, '0')}`,
      Severity: r.extra?.severity === 'ERROR' ? 'High' : (r.extra?.severity === 'WARNING' ? 'Medium' : 'Low'),
      Type: r.check_id.split('.').pop() || 'SAST Finding',
      File: `${r.path}:${r.start?.line}`,
      Endpoint: 'N/A',
      Description: r.extra?.message?.substring(0, 150) || 'Semgrep finding',
      Impact: 'Code vulnerability',
      Status: 'Open',
      Remediation: r.extra?.metadata?.cwe ? `Check CWE: ${r.extra.metadata.cwe}` : 'Review code'
    });
  });
}

// 2. Parse Gitleaks
const gitleaksData = loadJSON('gitleaks-results.json');
if (gitleaksData && Array.isArray(gitleaksData)) {
  gitleaksData.forEach((r, i) => {
    findings.push({
      ID: `SEC-${(i+1).toString().padStart(3, '0')}`,
      Severity: 'Critical',
      Type: 'Secret Leak',
      File: `${r.File}:${r.StartLine}`,
      Endpoint: 'N/A',
      Description: `Found ${r.Description} in commit ${r.Commit}`,
      Impact: 'Sensitive credential exposure',
      Status: 'Open',
      Remediation: 'Rotate secret and scrub git history'
    });
  });
}

// 3. Parse Trivy
const trivyData = loadJSON('trivy-results.json');
if (trivyData && trivyData.Results) {
  trivyData.Results.forEach(res => {
    if (res.Vulnerabilities) {
      res.Vulnerabilities.forEach((v) => {
        dependencies.push({
          Package: v.PkgName,
          CurrentVersion: v.InstalledVersion,
          LatestVersion: v.FixedVersion || 'Unknown',
          Severity: v.Severity,
          Issue: v.VulnerabilityID + ': ' + (v.Title || v.Description?.substring(0, 50)),
          Action: v.FixedVersion ? `Upgrade to ${v.FixedVersion}` : 'Investigate'
        });
      });
    }
  });
}

// 4. Parse pip-audit
const pipAuditData = loadJSON('pip-audit-results.json');
if (pipAuditData && pipAuditData.dependencies) {
  pipAuditData.dependencies.forEach(d => {
    if (d.vulns && d.vulns.length > 0) {
      d.vulns.forEach(v => {
        dependencies.push({
          Package: d.name,
          CurrentVersion: d.version,
          LatestVersion: v.fix_versions ? v.fix_versions.join(', ') : 'Unknown',
          Severity: 'High', // pip-audit doesn't always provide severity
          Issue: v.id + ': ' + (v.description ? v.description.substring(0, 50) : ''),
          Action: v.fix_versions ? `Upgrade to ${v.fix_versions[0]}` : 'Investigate'
        });
      });
    }
  });
}

console.log("Findings:", findings.length);
console.log("Dependencies:", dependencies.length);

// Just print the first one of each
console.log(findings[0]);
console.log(dependencies[0]);
