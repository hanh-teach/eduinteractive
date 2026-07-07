const fs = require('fs');
let code = fs.readFileSync('src/server/curriculum-store.ts', 'utf-8');

const searchObj = `  'coding-1': {
    id: 'coding-1',
    type: InteractionType.CODING,
    title: 'Hero Decision Script',
    description: 'Write a script that decides which path the hero takes.',
    competencyId: 'python.logic.if_statements',
    metadata: { language: 'python' }
  },`;
const replaceObj = searchObj + `
  'summary': {
    id: 'summary',
    type: InteractionType.SUMMARY || 'SUMMARY',
    title: 'Lesson Summary',
    description: 'Review your progress and get AI recommendations.',
    competencyId: 'python.logic.if_statements',
    metadata: {}
  },`;

code = code.replace(searchObj, replaceObj);

const searchGraph = `  'coding-1': {
    objectId: 'coding-1',
    next: {} // Terminal node for this demo
  }`;
const replaceGraph = `  'coding-1': {
    objectId: 'coding-1',
    next: { onSuccess: 'summary' } 
  },
  'summary': {
    objectId: 'summary',
    next: {}
  }`;

code = code.replace(searchGraph, replaceGraph);
fs.writeFileSync('src/server/curriculum-store.ts', code);
