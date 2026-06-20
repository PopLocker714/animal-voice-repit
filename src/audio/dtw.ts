// Dynamic Time Warping between two MFCC sequences.
// The two recordings can differ in speed/length; DTW finds the best alignment
// and returns a distance normalized by the alignment path length.
import type { MfccSequence } from "./features";

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Returns the path-length-normalized DTW distance between two MFCC sequences.
 * Lower = more similar. Returns Infinity if either sequence is empty.
 */
export function dtwDistance(seqA: MfccSequence, seqB: MfccSequence): number {
  const n = seqA.length;
  const m = seqB.length;
  if (n === 0 || m === 0) return Infinity;

  // cost[i][j] = best cumulative distance aligning A[0..i) with B[0..j)
  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );
  // steps[i][j] = number of frames on the best path to (i,j), for normalization
  const steps: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  cost[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const d = euclidean(seqA[i - 1], seqB[j - 1]);
      // pick the cheapest of the three predecessors (match / insert / delete)
      let best = cost[i - 1][j - 1];
      let bestSteps = steps[i - 1][j - 1];
      if (cost[i - 1][j] < best) {
        best = cost[i - 1][j];
        bestSteps = steps[i - 1][j];
      }
      if (cost[i][j - 1] < best) {
        best = cost[i][j - 1];
        bestSteps = steps[i][j - 1];
      }
      cost[i][j] = best + d;
      steps[i][j] = bestSteps + 1;
    }
  }

  const pathLength = steps[n][m] || 1;
  return cost[n][m] / pathLength;
}
