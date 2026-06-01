# FederiGene Deployment & Build Guide

This guide outlines the steps required to deploy updates to AWS and build the desktop executable (.exe).

## Prerequisites

Ensure you have the following CLI tools installed and configured:
- **AWS CLI**: `aws configure` (Access Key, Secret Key, Region)
- **EB CLI**: `eb init` (Elastic Beanstalk Command Line)
- **Node.js & npm**: For frontend and desktop builds
- **Rust**: Required for Tauri desktop builds

---

## 1. Backend Deployment (AWS Elastic Beanstalk)

The backend is a FastAPI application hosted on AWS Elastic Beanstalk.

1.  Open your terminal in the `Backend` directory:
    ```powershell
    cd Backend
    ```
2.  (Optional) Update your environment variables in the AWS Console if needed.
3.  Deploy the latest code:
    ```powershell
    eb deploy
    ```
4.  Check the status:
    ```powershell
    eb status
    ```

---

## 2. Frontend Deployment (AWS S3 & CloudFront)

The frontend is a React application built with Vite and hosted as a static site.

1.  Open your terminal in the `Frontend` directory:
    ```powershell
    cd Frontend
    ```
2.  Build the production bundle:
    ```powershell
    npm run build
    ```
3.  Sync the `dist` folder to your S3 bucket:
    ```powershell
    aws s3 sync dist/ s3://federigene-frontend-prod --delete
    ```
    *(Replace `federigene-frontend-bucket` with your actual bucket name)*
4.  **Invalidate CloudFront Cache** (to see changes immediately):
    ```powershell
    aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
    ```

### ⚠️ IMPORTANT: Handle 404s
If you haven't already, ensure **CloudFront Error Pages** are configured to redirect **404** errors to `/index.html` with a **200 OK** response. This is required for `BrowserRouter` to work correctly.

---

## 3. Desktop Build (.exe via Tauri)

The desktop application is built using Tauri.

1.  Open your terminal in the `Frontend` directory:
    ```powershell
    cd Frontend
    ```
2.  Run the Tauri build command:
    ```powershell
    npm run tauri build
    ```
3.  **Output Location**:
    The generated `.exe` and `.msi` installers will be located in:
    `Frontend/src-tauri/target/release/bundle/msi/` or `Frontend/src-tauri/target/release/bundle/exe/`

---

## 4. Mobile Build (Capacitor)

If you need to update the mobile apps:

1.  Build the web assets:
    ```powershell
    npm run build
    ```
2.  Sync to mobile platforms:
    ```powershell
    npx cap copy
    npx cap sync
    ```
3.  Open the native IDE to build the APK/IPA:
    ```powershell
    npx cap open android
    npx cap open ios
    ```
