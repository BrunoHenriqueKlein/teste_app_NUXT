const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB

// Simulate 162 attachments, total 23.5MB
const attachments = [];
const sizePerAtt = Math.floor((23.5 * 1024 * 1024) / 162);

for(let i=0; i<162; i++){
    attachments.push({ size: sizePerAtt });
}

const attachmentChunks = []
let currentChunk = []
let currentChunkSize = 0

for (const att of attachments) {
    if (currentChunkSize + att.size > MAX_ATTACHMENT_SIZE && currentChunk.length > 0) {
        attachmentChunks.push(currentChunk)
        currentChunk = []
        currentChunkSize = 0
    }
    currentChunk.push(att)
    currentChunkSize += att.size
}
if (currentChunk.length > 0) {
    attachmentChunks.push(currentChunk)
}

console.log('Chunks:', attachmentChunks.length);
console.log('Chunk sizes:', attachmentChunks.map(c => c.reduce((acc, curr) => acc + curr.size, 0) / 1024 / 1024));
