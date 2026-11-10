// ESM wrapper for run-virtual-node.cjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('./run-virtual-node.cjs');
