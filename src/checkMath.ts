import {
  apply2,
  backprop,
  cosine,
  det2,
  diffQuotient,
  dot,
  gdStep,
  matmul,
  naiveSoftmax,
  newtonStep,
  norm,
  parabolaIdentity,
  quadratic,
  scale,
  softmax,
  softmaxLossGrad,
  solve2,
  stableStepLimit,
  symEigen,
  transpose,
} from "./math";

function near(actual: number, expected: number, eps = 1e-9): boolean {
  return Math.abs(actual - expected) <= eps;
}

export function runChecks(): string[] {
  const failures: string[] = [];
  const expect = (ok: boolean, message: string) => {
    if (!ok) failures.push(message);
  };

  expect(near(dot([1, 0.5, -1], [0.5, 2, 0.25]), 1.25), "dot product");
  expect(near(norm([3, 4]), 5), "norm");
  const stretched = scale([1, 0], 5);
  expect(near(cosine([1, 0], stretched), 1) && near(dot([1, 0], stretched), 5), "cosine ignores stretch");

  const product = matmul(
    [
      [1, 0, 2],
      [0, 3, 1],
    ],
    [
      [1, 4],
      [2, 0],
      [0, 1],
    ],
  );
  expect(product.length === 2 && product[0].length === 2, "matmul shape");
  expect(near(product[0][0], 1) && near(product[0][1], 6) && near(product[1][0], 6) && near(product[1][1], 1), "matmul values");
  expect(transpose([[1, 2, 3], [4, 5, 6]])[2][1] === 6, "transpose");

  const solved = solve2([2, 0.8], [0.3, 1.6], [2.3, 2.4]);
  expect(solved.a !== null && solved.b !== null && near(2 * solved.a + 0.3 * solved.b, 2.3), "solve2");
  expect(near(det2([2, 0.8], [2, 0.8]), 0), "dependent det");

  const [large, small] = symEigen(2, 1, 2);
  expect(near(large, 3) && near(small, 1), "eigenvalues");
  const stretchedEigen = apply2(
    [
      [2, 1],
      [1, 2],
    ],
    [1, 1],
  );
  expect(near(stretchedEigen[0], 3) && near(stretchedEigen[1], 3), "eigenvector stretch");
  expect(
    near(
      quadratic(
        [
          [2, 0.5],
          [0.5, 1],
        ],
        [1.5, -1],
      ),
      2 * 2.25 + 1 + 1.5 * -1,
    ),
    "quadratic expansion",
  );

  const identity = parabolaIdentity(1, 0.1);
  expect(near(identity.quotient, identity.withH) && near(identity.slope, -4), "parabola limit identity");
  const cube = (value: number) => value ** 3;
  expect(near(diffQuotient(cube, 1, 1e-5), 3, 1e-4), "cube derivative");

  const plain = softmax([2, 1, 0]);
  const shifted = softmax([5, 4, 3]);
  expect(plain.every((value, index) => near(value, shifted[index], 1e-12)), "softmax shift");
  const overflow = naiveSoftmax([1000, 1001]);
  expect(overflow.some((value) => !Number.isFinite(value)), "naive softmax overflows");
  expect(softmax([1000, 1001]).every((value) => Number.isFinite(value)), "stable softmax");

  const lossGrad = softmaxLossGrad([1.2, 0.3, -0.4], 0);
  const nudged = softmaxLossGrad([1.2 + 1e-5, 0.3, -0.4], 0);
  const numeric = (nudged.loss - lossGrad.loss) / 1e-5;
  expect(near(numeric, lossGrad.grad[0], 1e-4), "softmax cross-entropy gradient");

  const forward = backprop(2, 0.5, 1.5, 1);
  expect(near(forward.loss, 0.25) && near(forward.dLossDw1, 3) && near(forward.dLossDw2, 1), "backprop");
  const dead = backprop(2, -0.5, 1.5, 1);
  expect(dead.gate === 0 && near(dead.dLossDw1, 0) && near(dead.loss, 1), "dead relu blocks the weight");

  expect(near(gdStep(0, 0.1), 0.6), "gradient step");
  expect(near(newtonStep(0), 3), "newton step lands on the minimum");
  expect(near(stableStepLimit(1), 1) && near(stableStepLimit(20), 0.05), "step size limit");

  const raw = softmax([1.2, 0.3, -0.8].map((value) => value * 8));
  const scaled = softmax([1.2, 0.3, -0.8]);
  expect(Math.max(...raw) > Math.max(...scaled) + 0.2, "unscaled scores saturate softmax");

  return failures;
}
