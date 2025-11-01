// scripts/zip-dist.js
import { zip } from "zip-a-folder";
import { existsSync } from "fs";

const zipPath = "./Sales-Navigator-Demon-Extension.zip";

async function main() {
    if (!existsSync("./dist")) {
        console.error("❌ dist/ folder not found. Run `npm run build` first.");
        process.exit(1);
    }

    console.log("📦 Zipping dist/ folder...");
    await zip("./dist", zipPath);
    console.log(`✅ Created ${zipPath}`);
}

main().catch((err) => {
    console.error("⚠️ Failed to create zip file:", err);
    process.exit(1);
});