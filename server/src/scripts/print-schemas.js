/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const modelsDir = path.join(__dirname, '../models');
const files = fs.readdirSync(modelsDir);

let output = '# MONGOOSE MODELS INVENTORY\n\n';

for (const file of files) {
  if (file.endsWith('.js')) {
    const modelPath = path.join(modelsDir, file);
    try {
      mongoose.models = {};
      mongoose.modelSchemas = {};

      const model = require(modelPath);
      const schema = model.schema;
      output += `### Model: **${model.modelName || path.basename(file, '.js')}** (\`server/src/models/${file}\`)\n\n`;
      output += '| Field | Type | Required | Ref | Default | Enum |\n';
      output += '| --- | --- | --- | --- | --- | --- |\n';
      for (const [key, val] of Object.entries(schema.paths)) {
        if (key === '__v') {
          continue;
        }
        const type = val.instance;
        const required = typeof val.options.required === 'function' ? 'Dynamic' : !!val.options.required;
        const ref = val.options.ref || '';
        const def = val.options.default !== undefined ? (typeof val.options.default === 'function' ? 'Function' : JSON.stringify(val.options.default)) : '';
        const enumVals = val.options.enum ? JSON.stringify(val.options.enum) : '';
        output += `| ${key} | ${type} | ${required} | ${ref} | ${def} | ${enumVals} |\n`;
      }
      if (schema._indexes && schema._indexes.length > 0) {
        output += '\n**Indexes:**\n';
        schema._indexes.forEach(idx => {
          output += `- ${JSON.stringify(idx[0])} (options: ${JSON.stringify(idx[1])})\n`;
        });
      }
      output += '\n---\n\n';
    } catch (e) {
      output += `Failed loading ${file}: ${e.message}\n\n---\n\n`;
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'schemas-output.txt'), output, 'utf8');
console.log('Schemas written successfully!');
process.exit(0);
