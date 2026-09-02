import assert from "node:assert/strict";
import test from "node:test";
import { applyVote, calculatePercentages } from "../src/poll.js";

test("calculates percentages from all vote counts", () => {
  assert.deepEqual(calculatePercentages({ C: 25, Java: 25, AI: 40, Blockchain: 10 }), { C: 25, Java: 25, AI: 40, Blockchain: 10 });
});

test("handles an empty poll without division errors", () => {
  assert.deepEqual(calculatePercentages({ C: 0, Java: 0, AI: 0, Blockchain: 0 }), { C: 0, Java: 0, AI: 0, Blockchain: 0 });
});

test("increments a valid option and rejects invalid input", () => {
  assert.equal(applyVote({ C: 1, Java: 2, AI: 3, Blockchain: 4 }, "AI").AI, 4);
  assert.throws(() => applyVote({ C: 1, Java: 2, AI: 3, Blockchain: 4 }, "Rust"), /Invalid poll option/);
});
