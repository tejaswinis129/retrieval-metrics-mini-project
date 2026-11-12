
const fs = require('fs');

// Load test dataset
function loadTestSet(path) {
    const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);

    return lines.map(line => {
        const [query, ids] = line.trim().split(',');
        return {
            query,
            correctIds: ids.split(';').map(Number)
        };
    });
}

const testSet = loadTestSet('test-set.csv');

// Load search results
const results = JSON.parse(
    fs.readFileSync('search-results.json', 'utf8')
);

// Calculate Reciprocal Rank
function reciprocalRank(rankedIds, correctIds) {
    for (let i = 0; i < rankedIds.length; i++) {
        if (correctIds.includes(Number(rankedIds[i]))) {
            return 1 / (i + 1);
        }
    }
    return 0;
}

// Find rank of the first correct answer
function rankOf(rankedIds, correctIds) {
    for (let i = 0; i < rankedIds.length; i++) {
        if (correctIds.includes(Number(rankedIds[i]))) {
            return i + 1;
        }
    }
    return null;
}

// Evaluation variables
const keywordRR = [];
const semanticRR = [];

let keywordHits = 0;
let semanticHits = 0;

// Evaluate every query
for (const item of testSet) {
    const keywordResults = results[item.query].keyword;
    const semanticResults = results[item.query].semantic;

    const kwRR = reciprocalRank(keywordResults, item.correctIds);
    const semRR = reciprocalRank(semanticResults, item.correctIds);

    keywordRR.push(kwRR);
    semanticRR.push(semRR);

    if (kwRR > 0) keywordHits++;
    if (semRR > 0) semanticHits++;
}

// Calculate MRR
const mean = arr =>
    arr.reduce((sum, value) => sum + value, 0) / arr.length;

const keywordMRR = mean(keywordRR);
const semanticMRR = mean(semanticRR);

// Calculate Recall@10
const keywordRecall = keywordHits / testSet.length;
const semanticRecall = semanticHits / testSet.length;

// Print comparison table
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');

for (const item of testSet) {
    const kwRank = rankOf(results[item.query].keyword, item.correctIds);
    const semRank = rankOf(results[item.query].semantic, item.correctIds);

    console.log(
        `| ${item.query} | ${kwRank ?? 'miss'} | ${semRank ?? 'miss'} |`
    );
}

// Print summary
console.log(
    `| **Summary** | **MRR ${keywordMRR.toFixed(2)} · Recall@10 ${keywordRecall.toFixed(2)}** | **MRR ${semanticMRR.toFixed(2)} · Recall@10 ${semanticRecall.toFixed(2)}** |`
);
