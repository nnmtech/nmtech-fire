#!/usr/bin/env node

// Change to the directory where this script is located
process.chdir(__dirname);

// Clear any problematic NODE_OPTIONS
delete process.env.NODE_OPTIONS;

// Require and run Next.js
require('./node_modules/next/dist/bin/next');
