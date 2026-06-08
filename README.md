# SetUsUp
BME VIK Bachelor's Thesis

# SetUsUp — Developer setup
## 1. Database (SSMS: SQL Server Management Studio)
 
1. Open **SSMS** and connect to your local SQL Server instance.<br>
default auth: (localdb)\mssqllocaldb and Windows Authentication. If differs for you, scroll down to Troubleshooting at the botttom.
3. In **Object Explorer**, right-click **Databases** → **Restore Database…**.
4. Choose **Device** as the source, click **…**, and add the `.bak` file from `SetUsUpDB/`.
5. Click **OK** to restore. The database lands as `SetUsUpDB_REF` by default.
 
## 2. Backend (Visual Studio)
 
1. Open `SetUsUpBE/SetUsUpBE.sln`.
2. Right-click **SetUsUpBE.WebAPI** in Solution Explorer → **Set as Startup Project** (if it isn't already).
3. Press **F5** (or click **Run**). Use the http profile.
4. Swagger UI opens in your browser (default: `http://localhost:5072/swagger`).
NuGet packages restore automatically on first build.
 
## 3. Frontend (VS Code)
 
Open `SetUsUpFE/` in VS Code, then in the integrated terminal:
 
```bash
npm install
npm run dev
```
 
The dev server starts on `http://localhost:5173`. Open that URL in your browser.
 
## 4. Login
 
Two seeded test accounts are available in the restored database:
 
| Username   | Password    |
|------------|-------------|
| A-Drum     | R@ffae110   |
| Patrixxx   | R@ffae110   |
 
Log in as either; or log in as both in two separate browsers (or one browser + one incognito window) to test the real-time multi-user collaboration — drag-and-drop reordering, ratings, comments, and metadata edits all propagate between clients.
 
## Troubleshooting
 
- **Backend can't connect to the database** — edit `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` to match your SQL Server instance and authentication method (Windows or SQL).
- **CORS or WebSocket errors** — the dev CORS policy expects the backend on port `5072` and the frontend on `5173`. Don't change either port for local dev unless you also update the CORS configuration and `JwtConfiguration.ReactAudience`.
- **SSMS restore fails with a permissions error** — make sure your SQL Server service account can read the folder containing the `.bak` file; if not, copy the `.bak` into SQL Server's default backup folder first.
