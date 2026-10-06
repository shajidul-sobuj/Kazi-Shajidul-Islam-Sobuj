const matches = {};
const reqId = "R10";
const fileId = "file-123";

const next = { ...matches };
next[reqId] = fileId;
console.log(next);
