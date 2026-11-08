export function snap(value: number, step = 0.1): number {
  const places = Math.round(1 / step);
  return Math.round(value * places) / places;
}

export function dot(left: number[], right: number[]): number {
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) sum += left[index] * right[index];
  return sum;
}

export function add(left: number[], right: number[]): number[] {
  return left.map((value, index) => value + right[index]);
}

export function scale(vector: number[], factor: number): number[] {
  return vector.map((value) => value * factor);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function norm(vector: number[]): number {
  return Math.sqrt(sum(vector.map((value) => value * value)));
}

export function l1(vector: number[]): number {
  return sum(vector.map((value) => Math.abs(value)));
}

export function cosine(left: number[], right: number[]): number {
  const denom = norm(left) * norm(right);
  return denom === 0 ? 0 : dot(left, right) / denom;
}

export function matvec(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dot(row, vector));
}

export function matmul(left: number[][], right: number[][]): number[][] {
  const cols = right[0].length;
  return left.map((row) => {
    const out = Array<number>(cols).fill(0);
    for (let col = 0; col < cols; col += 1) {
      for (let k = 0; k < row.length; k += 1) out[col] += row[k] * right[k][col];
    }
    return out;
  });
}

export function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

export function det2(u: [number, number], v: [number, number]): number {
  return u[0] * v[1] - u[1] * v[0];
}

export function solve2(
  u: [number, number],
  v: [number, number],
  point: [number, number],
): { det: number; a: number | null; b: number | null } {
  const det = det2(u, v);
  if (Math.abs(det) < 1e-8) return { det, a: null, b: null };
  const a = det2(point, v) / det;
  const b = det2(u, point) / det;
  return { det, a, b };
}

export function apply2(matrix: [[number, number], [number, number]], vector: [number, number]): [number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1],
  ];
}

export function symEigen(a: number, b: number, c: number): [number, number] {
  const gap = Math.sqrt((a - c) * (a - c) + 4 * b * b);
  return [(a + c + gap) / 2, (a + c - gap) / 2];
}

export function quadratic(matrix: [[number, number], [number, number]], vector: [number, number]): number {
  const transformed = apply2(matrix, vector);
  return vector[0] * transformed[0] + vector[1] * transformed[1];
}

export function softmax(logits: number[]): number[] {
  let peak = -Infinity;
  for (const value of logits) if (value > peak) peak = value;
  const lifted = logits.map((value) => Math.exp(value - peak));
  const total = sum(lifted);
  return lifted.map((value) => value / total);
}

export function naiveSoftmax(logits: number[]): number[] {
  const lifted = logits.map((value) => Math.exp(value));
  const total = sum(lifted);
  return lifted.map((value) => value / total);
}

export function crossEntropy(probs: number[], correct: number): number {
  return -Math.log(Math.max(probs[correct], 1e-12));
}

export function softmaxLossGrad(logits: number[], correct: number): { probs: number[]; grad: number[]; loss: number } {
  const probs = softmax(logits);
  return {
    probs,
    grad: probs.map((prob, index) => prob - (index === correct ? 1 : 0)),
    loss: crossEntropy(probs, correct),
  };
}

export function diffQuotient(f: (value: number) => number, x: number, h: number): number {
  return (f(x + h) - f(x)) / h;
}

export function parabolaIdentity(w: number, h: number, center = 3): { quotient: number; slope: number; withH: number } {
  const loss = (value: number) => (value - center) ** 2;
  const quotient = diffQuotient(loss, w, h);
  const slope = 2 * (w - center);
  return { quotient, slope, withH: slope + h };
}

export function backprop(x: number, w1: number, w2: number, target: number) {
  const z = w1 * x;
  const gate = z > 0 ? 1 : 0;
  const hidden = gate ? z : 0;
  const prediction = w2 * hidden;
  const error = prediction - target;
  const loss = error * error;
  const dLossDprediction = 2 * error;
  const dLossDw2 = dLossDprediction * hidden;
  const dLossDhidden = dLossDprediction * w2;
  const dLossDz = dLossDhidden * gate;
  const dLossDw1 = dLossDz * x;
  return { z, gate, hidden, prediction, error, loss, dLossDprediction, dLossDw2, dLossDhidden, dLossDz, dLossDw1 };
}

export function gdStep(w: number, eta: number, center = 3, curvature = 1): number {
  const slope = 2 * curvature * (w - center);
  return w - eta * slope;
}

export function newtonStep(w: number, center = 3): number {
  const slope = 2 * (w - center);
  const second = 2;
  return w - slope / second;
}

export function stableStepLimit(curvature: number): number {
  return 1 / curvature;
}
