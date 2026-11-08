import { ChainLesson, CurvatureLesson, DerivativeLesson, DescentLesson, FunctionLesson, JacobianLesson, PartialsLesson, RulesLesson, SlopeLesson, SoftmaxLesson } from "./calculus";
import { CombineLesson, DotLesson, EigenLesson, LinearLesson, MultiplyLesson, NormLesson, QuadraticLesson, RankLesson, TransposeLesson, VectorsLesson } from "./algebra";

export const labs = {
  vectors: VectorsLesson,
  combine: CombineLesson,
  dot: DotLesson,
  norm: NormLesson,
  "linear-layer": LinearLesson,
  multiply: MultiplyLesson,
  transpose: TransposeLesson,
  rank: RankLesson,
  eigen: EigenLesson,
  quadratic: QuadraticLesson,
  function: FunctionLesson,
  slope: SlopeLesson,
  derivative: DerivativeLesson,
  rules: RulesLesson,
  partials: PartialsLesson,
  descent: DescentLesson,
  chain: ChainLesson,
  softmax: SoftmaxLesson,
  jacobian: JacobianLesson,
  curvature: CurvatureLesson,
};
