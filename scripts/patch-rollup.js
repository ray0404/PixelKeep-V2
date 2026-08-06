import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rollupNativePath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes("id.includes('android')")) {
    const target = 'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {';
    const replacement = 'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {\n\t\tif (id.includes(\'android\')) {\n\t\t\ttry {\n\t\t\t\treturn require(\'@rollup/rollup-linux-arm64-gnu\');\n\t\t\t} catch {}\n\t\t}';
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(rollupNativePath, content, 'utf8');
      console.log('[postinstall] Applied Termux Android Rollup native binding patch successfully.');
    }
  }
}
