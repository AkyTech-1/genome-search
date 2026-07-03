#!/usr/bin/env python3
"""
build_azure.py — Viral Genome Intelligence · Azure Deployment Builder
======================================================================
Builds the React frontend, bundles everything into a self-contained Python
package, and zips it ready for Azure App Service deployment.

Usage
-----
    python build_azure.py

Output
------
    azure_deploy/          ← unzipped staging directory
    vgi_azure_deploy.zip   ← upload this to Azure App Service

Azure App Service setup
-----------------------
1. Create an Azure App Service (Linux, Python 3.12 or 3.13).
2. Under Configuration → General Settings → Startup Command, enter:
       bash startup.sh
3. Zip-deploy: az webapp deploy --src-path vgi_azure_deploy.zip
   Or drag-and-drop in Kudu (https://<app>.scm.azurewebsites.net).
"""

import os
import sys
import shutil
import subprocess
import zipfile
import pathlib

ROOT = pathlib.Path(__file__).parent
API_SRC = ROOT / "artifacts" / "api-server"
FRONTEND_SRC = ROOT / "artifacts" / "genome-search"
FRONTEND_DIST = FRONTEND_SRC / "dist" / "public"
DEPLOY_DIR = ROOT / "azure_deploy"
ZIP_OUT = ROOT / "vgi_azure_deploy.zip"


def run(cmd: list[str], cwd: pathlib.Path | None = None, env: dict | None = None):
    full_env = {**os.environ, **(env or {})}
    print(f"\n▶  {' '.join(cmd)}", flush=True)
    result = subprocess.run(cmd, cwd=cwd, env=full_env)
    if result.returncode != 0:
        sys.exit(f"✗ Command failed: {' '.join(cmd)}")


def main():
    print("=" * 60)
    print("  Viral Genome Intelligence — Azure Build")
    print("=" * 60)

    # ── 1. Install Node deps ────────────────────────────────────────
    print("\n[1/5] Installing Node.js dependencies...")
    run(["pnpm", "install", "--frozen-lockfile"], cwd=ROOT)

    # ── 2. Build React frontend ─────────────────────────────────────
    print("\n[2/5] Building React frontend...")
    run(
        ["pnpm", "--filter", "@workspace/genome-search", "run", "build"],
        cwd=ROOT,
        env={
            "PORT": "3000",        # Vite requires PORT during config evaluation
            "BASE_PATH": "/",      # Serve from root in Azure
            "NODE_ENV": "production",
        },
    )
    if not FRONTEND_DIST.exists():
        sys.exit(f"✗ Expected build output at {FRONTEND_DIST} but it wasn't found.")
    print(f"  ✓ Frontend built → {FRONTEND_DIST}")

    # ── 3. Stage deployment directory ──────────────────────────────
    print("\n[3/5] Staging azure_deploy/...")
    if DEPLOY_DIR.exists():
        shutil.rmtree(DEPLOY_DIR)
    DEPLOY_DIR.mkdir()

    # Copy Python server files
    for fname in ["main.py", "requirements.txt", "startup.sh", "web.config"]:
        src = API_SRC / fname
        if src.exists():
            shutil.copy2(src, DEPLOY_DIR / fname)
            print(f"  ✓ {fname}")

    # Copy built React app into static/
    static_dst = DEPLOY_DIR / "static"
    shutil.copytree(FRONTEND_DIST, static_dst)
    file_count = sum(1 for _ in static_dst.rglob("*") if _.is_file())
    print(f"  ✓ static/ ({file_count} files from React build)")

    # Create a minimal .gitignore so Azure Kudu doesn't try to run git ops
    (DEPLOY_DIR / ".gitignore").write_text("__pycache__/\n*.pyc\n.env\n")

    # ── 4. Zip it up ────────────────────────────────────────────────
    print(f"\n[4/5] Creating {ZIP_OUT.name}...")
    if ZIP_OUT.exists():
        ZIP_OUT.unlink()
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(DEPLOY_DIR.rglob("*")):
            if file.is_file():
                arcname = file.relative_to(DEPLOY_DIR)
                zf.write(file, arcname)
    size_mb = ZIP_OUT.stat().st_size / 1_048_576
    print(f"  ✓ {ZIP_OUT.name} ({size_mb:.1f} MB)")

    # ── 5. Done ──────────────────────────────────────────────────────
    print("\n[5/5] Done!")
    print("\n" + "=" * 60)
    print("  NEXT STEPS — Deploy to Azure App Service")
    print("=" * 60)
    print(f"""
  1. Create an Azure App Service:
       az webapp create \\
         --resource-group <your-rg> \\
         --plan <your-plan> \\
         --name <your-app-name> \\
         --runtime "PYTHON:3.12"

  2. Set the startup command:
       az webapp config set \\
         --name <your-app-name> \\
         --resource-group <your-rg> \\
         --startup-file "bash startup.sh"

  3. Deploy the zip:
       az webapp deploy \\
         --name <your-app-name> \\
         --resource-group <your-rg> \\
         --src-path {ZIP_OUT.name} \\
         --type zip

  Your app will be live at:
       https://<your-app-name>.azurewebsites.net
""")


if __name__ == "__main__":
    main()
