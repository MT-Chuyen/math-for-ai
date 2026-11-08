import { useState } from "react";
import { add, apply2, cosine, det2, dot, l1, matmul, norm, scale, softmax, solve2, symEigen, transpose } from "../math";
import { Bars, Heatmap, VectorPlane } from "../plots";
import { Board, Frame, Frac, Goal, MatrixCells, Num, Prose, Scalar, Section, SumLine, VectorEditor, fmt } from "../ui";

function symbols(items: [string, string][]) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map(([symbol, meaning]) => (
        <li key={symbol} className="flex gap-3 rounded-md bg-white px-3 py-2">
          <span className="font-serif text-lg text-slate-900">{symbol}</span>
          <span className="text-sm leading-snug text-slate-600">{meaning}</span>
        </li>
      ))}
    </ul>
  );
}

export function VectorsLesson() {
  const [pixel, setPixel] = useState([0.9, 0.1, 0.15]);
  const rotated = [pixel[1], pixel[2], pixel[0]];
  const sameNumbers = pixel.every((value, index) => value === rotated[index]);
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A scalar is one number, such as a learning rate. A vector is a list of scalars with a fixed order. The first slot is a different fact from the second slot. The dimension is how many slots there are. This pixel is a vector in dimension 3: red, green, then blue.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>x = (x₁, x₂, …, xₙ)</span>
        </Board>
        <Prose>Read it aloud as: x is the list whose i-th entry is the number xᵢ. n is the length of the list. Swapping entries makes a different vector, even when the bag of numbers is the same.</Prose>
        {symbols([
          ["x", "the whole list, one object"],
          ["xᵢ", "the number sitting in position i"],
          ["n", "how many positions there are"],
          ["scalar", "a single number, not a list"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <VectorEditor label="Pixel vector x" hint="Each slider is one entry. Position is part of the object." values={pixel} onChange={setPixel} min={0} max={1} step={0.05} />
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 rounded-md border border-slate-300" style={{ background: `rgb(${pixel[0] * 255}, ${pixel[1] * 255}, ${pixel[2] * 255})` }} />
          <div>
            <p className="font-mono text-sm">
              x = ({pixel.map((value) => fmt(value)).join(", ")})
            </p>
            <p className="mt-1 text-sm text-slate-600">
              x₁ = <Num value={pixel[0]} tone="blue" />, x₂ = <Num value={pixel[1]} tone="blue" />, x₃ = <Num value={pixel[2]} tone="blue" />. Dimension n = 3.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 rounded-md border border-slate-300" style={{ background: `rgb(${rotated[0] * 255}, ${rotated[1] * 255}, ${rotated[2] * 255})` }} />
          <p className="max-w-xl text-sm text-slate-700">
            Move the first entry to the end and you get ({rotated.map((value) => fmt(value)).join(", ")}). Same three numbers, different color
            {sameNumbers ? " — here the three entries happen to be equal, so the swap is invisible." : "."}
          </p>
        </div>
        <Goal met={pixel[2] > pixel[0] && pixel[2] > pixel[1]}>Make the third entry the largest, so the swatch turns blue. The vector changed because one position changed.</Goal>
      </Section>
      <Section id="model" kicker="The same object in a model">
        <Prose>
          A token in a transformer is this kind of list, often a few hundred entries long. A pixel patch is this kind of list too. The rest of algebra is what you are allowed to do to two such lists: add them, scale them, and turn a pair of them into one number. Nothing later in a paper is a new kind of object. It is a bigger list, or a table of lists.
        </Prose>
      </Section>
    </Frame>
  );
}

export function CombineLesson() {
  const [base, setBase] = useState([1, 0.2, -0.4]);
  const [update, setUpdate] = useState([0.3, -0.5, 0.8]);
  const [alpha, setAlpha] = useState(1);
  const result = add(base, scale(update, alpha));
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          Two vectors of the same length add by lining up their entries. Scaling multiplies every entry by one scalar. Doing both is a linear combination. The result is a new list. No entry is allowed to look at a neighbor during the addition itself.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>(x + α δ)ᵢ = xᵢ + α δᵢ</span>
        </Board>
        <Prose>For each position i, take the number already there, and add alpha times the update at that same position. Alpha is one knob. It scales the whole update, not one entry.</Prose>
        {symbols([
          ["x", "the list you already have"],
          ["δ", "the update, another list of the same length"],
          ["α", "one number that grows or shrinks the whole update"],
          ["i", "the position you are working on"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 lg:grid-cols-2">
          <VectorEditor label="x, the list you keep" hint="Blue numbers." values={base} onChange={setBase} />
          <VectorEditor label="δ, the update" hint="Amber numbers, before the scale." values={update} onChange={setUpdate} />
        </div>
        <Scalar label="α, the scale on the update" value={alpha} onChange={setAlpha} min={-1} max={2} step={0.1} />
        <div className="space-y-2">
          {result.map((value, index) => (
            <p key={index} className="font-mono text-sm">
              entry {index + 1}: <Num value={base[index]} tone="blue" /> + <Num value={alpha} /> × <Num value={update[index]} tone="amber" /> = <Num value={base[index]} tone="blue" /> + <Num value={alpha * update[index]} tone="amber" /> = <Num value={value} tone="green" />
            </p>
          ))}
        </div>
        <Goal met={Math.abs(alpha) < 0.05}>Set α to 0. Every result entry equals the original entry. The update is still there, and it contributes nothing.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A residual block does not replace its input. It computes an update and adds it: output = x + Δ. In the formula above, Δ is α δ, already scaled by whatever the block learned. If the update is zero, the block is a wire and the next layer still sees x. Doubling Δ doubles every coordinate of the change and leaves x untouched. That is the whole content of the plus sign in x + Δ.
        </Prose>
        <p className="font-mono text-sm">
          output = ({result.map((value) => fmt(value)).join(", ")})
        </p>
      </Section>
    </Frame>
  );
}

export function DotLesson() {
  const [query, setQuery] = useState([1, 0.5, -1]);
  const [key, setKey] = useState([0.5, 2, 0.25]);
  const products = query.map((value, index) => value * key[index]);
  const score = dot(query, key);
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          The dot product compresses two lists into one number. At each position, multiply the two numbers that share that position. Then add the products. A positive product is agreement at that position. A negative product is a fight. The final number is what is left after the fights.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>a · b = Σᵢ aᵢ bᵢ</span>
        </Board>
        <Prose>The sigma says “add these up”. The subscript i walks along both lists together. The lists must have the same length, or some number has no partner.</Prose>
        {symbols([
          ["a · b", "one number, the dot product"],
          ["aᵢ bᵢ", "the product at position i"],
          ["Σᵢ", "add a term for every position"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 lg:grid-cols-2">
          <VectorEditor label="q, a query" hint="One token asking." values={query} onChange={setQuery} />
          <VectorEditor label="k, a key" hint="One token being asked about." values={key} onChange={setKey} />
        </div>
        <SumLine terms={query.map((value, index) => ({ left: value, right: key[index] }))} />
        <ul className="space-y-1 text-sm text-slate-700">
          {products.map((value, index) => (
            <li key={index}>
              Position {index + 1} contributes <Num value={value} tone={value < 0 ? "amber" : "green"} />.
              {value < 0 ? " These two entries point opposite ways, so they pull the total down." : " These two entries have the same sign, so they pull the total up."}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-700">
          The score is <Num value={score} tone="green" />. {score === 0 ? "Zero means the two lists are perpendicular: agreement and disagreement cancelled." : score > 0 ? "Positive means the query and the key agree more than they fight." : "Negative means they fight more than they agree."}
        </p>
        <Goal met={score < 0}>Make the dot product negative. Flip the sign of one entry, or grow the pair that is already fighting.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          In attention, the raw match between a query and a key is this dot product. One number per key. A large positive number means “this key looks like what I am looking for”. The next lesson explains why that number is then divided by √d before it is turned into a weight. The division does not change who is being dotted with whom. It changes the size of this score.
        </Prose>
      </Section>
    </Frame>
  );
}

export function NormLesson() {
  const [query, setQuery] = useState([1, 0.5, -1]);
  const [key, setKey] = useState([0.5, 2, 0.25]);
  const [stretch, setStretch] = useState(1);
  const [mix, setMix] = useState(0);
  const [features, setFeatures] = useState(4);
  const stretched = scale(key, stretch);
  const lengthQ = norm(query);
  const lengthK = norm(stretched);
  const raw = dot(query, stretched);
  const angle = cosine(query, stretched);
  const squares = stretched.map((value) => value * value);
  const sparse = [3, 0];
  const spread = [1.5, 1.5];
  const sample = sparse.map((value, index) => (1 - mix) * value + mix * spread[index]);
  const typical = [1.2, 0.3, -0.8];
  const width = Math.sqrt(features);
  const rawScores = typical.map((value) => value * width);
  const softRaw = softmax(rawScores);
  const softScaled = softmax(typical);
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          The L2 norm is the length of the arrow from the origin to the vector. Pythagoras still applies: square every entry, add the squares, take the square root. Cosine divides the dot product by both lengths, so it keeps the angle and throws away the size. The L1 norm just adds absolute values. Squaring is why L2 punishes one huge entry more than L1 does.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>‖x‖ = √(Σᵢ xᵢ²)</span>
          <span className="px-3 text-slate-400">and</span>
          <span>
            cos θ = <Frac num="a · b" den="‖a‖ ‖b‖" />
          </span>
        </Board>
        <Prose>Stretch b by 5 and the dot product grows by 5, because every product grows by 5. The length of b also grows by 5, so the ratio that defines cosine does not move.</Prose>
        {symbols([
          ["‖x‖", "length, always ≥ 0"],
          ["xᵢ²", "the square that makes signs disappear"],
          ["θ", "the angle between the two arrows"],
          ["√d", "the typical size of a random dot of length d"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 lg:grid-cols-2">
          <VectorEditor label="q" hint="Held still while you stretch the key." values={query} onChange={setQuery} />
          <VectorEditor label="k, before the stretch" hint="The stretch below multiplies this whole list." values={key} onChange={setKey} />
        </div>
        <Scalar label="Stretch applied to k" value={stretch} onChange={setStretch} min={-3} max={3} step={0.1} note="Negative stretch flips the key. The angle flips with it. A positive stretch does not." />
        <p className="text-sm text-slate-700">
          Squares of the stretched key: {squares.map((value) => fmt(value)).join(" + ")} = <Num value={squares.reduce((sum, value) => sum + value, 0)} />. Length ‖k‖ = √that = <Num value={lengthK} tone="green" />. ‖q‖ = <Num value={lengthQ} />.
        </p>
        <p className="text-sm text-slate-700">
          Dot q · k = <Num value={raw} tone="amber" />.
          {lengthQ === 0 || lengthK === 0 ? (
            <> A zero vector has no direction, so cosine refuses to divide by a zero length.</>
          ) : (
            <>
              {" "}
              Divide by both lengths: <Num value={raw} /> / (<Num value={lengthQ} /> × <Num value={lengthK} />) = <Num value={angle} tone="green" />. That is the cosine.
            </>
          )}
        </p>
        <Goal met={stretch > 1.4 && lengthK > 0 && Math.abs(angle - cosine(query, key)) < 1e-9}>
          Move the stretch above 1. The dot changes from {fmt(dot(query, key))} to {fmt(raw)}. The cosine stays {fmt(cosine(query, key))}.
        </Goal>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold">Same L1, different L2</p>
          <Scalar label="Mix from a spike (3, 0) toward a spread (1.5, 1.5)" value={mix} onChange={setMix} min={0} max={1} step={0.05} />
          <p className="mt-2 text-sm text-slate-700">
            Vector ({fmt(sample[0])}, {fmt(sample[1])}). L1 = |{fmt(sample[0])}| + |{fmt(sample[1])}| = <Num value={l1(sample)} />. L2 = <Num value={norm(sample)} />. At the two ends the L1 norm is 3 either way. The spike has the larger L2, because 3² is bigger than 1.5² + 1.5².
          </p>
        </div>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Softmax only sees differences between scores. If query and key entries behave like mean-zero noise, a dot of d of them has typical size √d, and the gap between two such dots has that size too. Dividing by √d puts the gap back near 1, so softmax does not collapse onto a single key. Cosine is the same idea taken all the way: divide by both lengths. Attention divides by √d only, a cheaper stand-in that assumes the entries already have a modest size.
        </Prose>
        <Scalar label="d, how many features are in the dot" value={features} onChange={setFeatures} min={1} max={64} step={1} note="Typical scores are √d times (1.20, 0.30, −0.80). Dividing by √d returns exactly those three numbers." />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">Softmax of the raw typical scores</p>
            <Bars values={softRaw} labels={["key A", "key B", "key C"]} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Softmax after dividing by √d</p>
            <Bars values={softScaled} labels={["key A", "key B", "key C"]} />
          </div>
        </div>
        <p className="text-sm text-slate-700">
          √d = <Num value={width} />. Raw scores ({rawScores.map((value) => fmt(value)).join(", ")}). The tallest raw probability is <Num value={Math.max(...softRaw)} />. After the division it is <Num value={Math.max(...softScaled)} />, and it does not move when you drag d.
        </p>
      </Section>
    </Frame>
  );
}

export function LinearLesson() {
  const [weights, setWeights] = useState([
    [0.5, -1, 2],
    [1, 0.5, 0],
  ]);
  const [input, setInput] = useState([2, 1, 0.5]);
  const [bias, setBias] = useState([0.1, -0.2]);
  const outputs = weights.map((row, index) => dot(row, input) + bias[index]);
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A matrix is a stack of vectors, written as a table. Multiplying that table by x builds one dot product per row. Row i only looks at its own weights. The bias is a vector added after those dots, one number per output. The layer is called linear because doubling x doubles the Wx part, and adding two inputs adds their outputs. Bias shifts the result without breaking that pattern in the weights.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>yᵢ = Σⱼ Wᵢⱼ xⱼ + bᵢ</span>
        </Board>
        <Prose>i picks the output neuron, which is a row. j walks across the input. Wᵢⱼ is the weight in row i, column j. It multiplies input entry j, and only that entry.</Prose>
        {symbols([
          ["W", `the weight table, here ${weights.length} rows by ${weights[0].length} columns`],
          ["x", "the input vector, one entry per column"],
          ["b", "the bias, one entry per row"],
          ["yᵢ", "output number i"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="flex flex-wrap gap-6">
          <MatrixCells label="W, two neurons by three inputs" rows={weights} onChange={setWeights} />
          <VectorEditor label="x" hint="One number per column of W." values={input} onChange={setInput} />
          <VectorEditor label="b" hint="Added after the dot. One number per neuron." values={bias} onChange={setBias} min={-2} max={2} />
        </div>
        {weights.map((row, index) => (
          <div key={index}>
            <p className="mb-1 text-sm font-semibold">Neuron {index + 1}</p>
            <SumLine terms={row.map((value, column) => ({ left: value, right: input[column] }))} extra={bias[index]} showExtra />
          </div>
        ))}
        <p className="text-sm text-slate-700">
          y = ({fmt(outputs[0])}, {fmt(outputs[1])}). Shape check: W is {weights.length}×{weights[0].length}, x has {input.length} entries, and {weights[0].length === input.length ? "those inner sizes match, so the dots are legal." : "the inner sizes disagree, so this layer is not a legal multiply."}
        </p>
        <Goal met={outputs[0] < 0}>Make neuron 1 negative. A ReLU placed after this layer would turn that output into 0, and the calculus lessons show why that also blocks its gradient.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Every linear layer, every projection that builds a query, and the last classification layer are this formula. The nonlinearity (ReLU, GELU, softmax) sits between these linear maps. If you can expand one row into products and a sum, you can read a forward pass. The backward pass uses the same table, flipped. That flip is the transpose lesson.
        </Prose>
      </Section>
    </Frame>
  );
}

export function MultiplyLesson() {
  const [left, setLeft] = useState([
    [1, 0, 2],
    [0, 3, 1],
  ]);
  const [right, setRight] = useState([
    [1, 4],
    [2, 0],
    [0, 1],
  ]);
  const [broken, setBroken] = useState(false);
  const usedRight = broken ? right.slice(0, 2) : right;
  const legal = left[0].length === usedRight.length;
  const product = legal ? matmul(left, usedRight) : [];
  const [cell, setCell] = useState({ row: 0, col: 0 });
  const [queries, setQueries] = useState([
    [1, 0],
    [0.5, 1],
  ]);
  const [keys, setKeys] = useState([
    [1, 1],
    [0, 2],
  ]);
  const [pair, setPair] = useState({ token: 0, key: 0 });
  const scores = queries.map((query) => keys.map((key) => dot(query, key)));
  const scale = 1 / Math.sqrt(queries[0].length);
  const weights = scores.map((row) => softmax(row.map((value) => value * scale)));
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          Matrix multiplication is many matrix–vector products at once. Column j of B is one input vector. Row i of A dots with that column and writes the result at row i, column j of the product. The number of columns of A must equal the number of rows of B, because that is the length of the dot.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>(AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ</span>
        </Board>
        <Prose>
          Shape: A is m×n and B is n×p, so AB is m×p. The shared n is used up by the sum. It does not appear in the result. Here m = {left.length}, n = {left[0].length}, p = {usedRight[0].length}.
        </Prose>
        {symbols([
          ["i", "which row of A, and which row of the result"],
          ["j", "which column of B, and which column of the result"],
          ["k", "the index that walks along the row and down the column"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="flex flex-wrap items-end gap-6">
          <MatrixCells label="A, 2×3" rows={left} onChange={setLeft} highlightRow={cell.row} />
          <MatrixCells
            label={broken ? "B, broken to 2×2" : "B, 3×2"}
            rows={usedRight}
            highlightCol={cell.col}
            onChange={(next) => {
              if (broken) setRight([next[0], next[1], right[2]]);
              else setRight(next);
            }}
          />
          <button type="button" className="rounded-md bg-[#172554] px-3 py-2 text-sm font-semibold text-white" onClick={() => setBroken((value) => !value)}>
            {broken ? "Restore the matching shape" : "Break the inner shape"}
          </button>
        </div>
        {legal ? (
          <>
            <div className="flex flex-wrap gap-2">
              {product.map((row, i) =>
                row.map((value, j) => (
                  <button key={`${i}-${j}`} type="button" className={`rounded-md px-3 py-2 font-mono text-sm ${cell.row === i && cell.col === j ? "bg-[#172554] text-white" : "bg-white"}`} onClick={() => setCell({ row: i, col: j })}>
                    row {i + 1}, col {j + 1}: {fmt(value)}
                  </button>
                )),
              )}
            </div>
            <p className="text-sm text-slate-700">
              The selected cell pairs row {cell.row + 1} of A with column {cell.col + 1} of B.
            </p>
            <SumLine terms={left[cell.row].map((value, k) => ({ left: value, right: usedRight[k][cell.col] }))} />
            <Goal met={Math.abs(product[cell.row][cell.col] - 10) < 0.05}>Make the selected cell equal 10. Only the highlighted row of A and column of B can move it.</Goal>
          </>
        ) : (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
            A has {left[0].length} columns and B has {usedRight.length} rows. Entry k = {left[0].length} of the row has no partner in the column. The product is undefined. Restoring B puts the third row back, and the sum has three terms again.
          </p>
        )}
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Attention scores are one matrix product. Store each query as a row of Q and each key as a row of K. Then Kᵀ has those keys as columns, and (QKᵀ)ᵢⱼ = query i · key j. Below, two tokens and two features. Divide each row by √d, then softmax turns the row into weights that add to 1.
        </Prose>
        <div className="flex flex-wrap gap-6">
          <MatrixCells label="Q, tokens × features" rows={queries} onChange={setQueries} highlightRow={pair.token} />
          <MatrixCells label="K, tokens × features" rows={keys} onChange={setKeys} highlightRow={pair.key} />
        </div>
        <div className="flex flex-wrap gap-2">
          {scores.map((row, i) =>
            row.map((value, j) => (
              <button key={`${i}-${j}`} type="button" className={`rounded-md px-3 py-2 text-left text-sm ${pair.token === i && pair.key === j ? "bg-[#172554] text-white" : "bg-white"}`} onClick={() => setPair({ token: i, key: j })}>
                <span className="block font-semibold">score {i + 1},{j + 1}</span>
                q·k = {fmt(value)}, scaled {fmt(value * scale)}, weight {fmt(weights[i][j])}
              </button>
            )),
          )}
        </div>
        <SumLine terms={queries[pair.token].map((value, index) => ({ left: value, right: keys[pair.key][index] }))} />
        <p className="text-sm text-slate-700">
          Q is {queries.length}×{queries[0].length}. Kᵀ is {keys[0].length}×{keys.length}. The product is {queries.length}×{keys.length}. One row of weights adds to <Num value={weights[pair.token].reduce((sum, value) => sum + value, 0)} />.
        </p>
      </Section>
    </Frame>
  );
}

export function TransposeLesson() {
  const [matrix, setMatrix] = useState([
    [1, 0, 2],
    [0.5, 1, -1],
  ]);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(2);
  const flipped = transpose(matrix);
  const keys = [
    [1, 0],
    [0.5, 1],
    [1, 1],
  ];
  const query = [2, 0.5];
  const byHand = keys.map((key) => dot(query, key));
  const batched = matmul([query], transpose(keys))[0];
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          Transpose flips a table across its diagonal. The number that was in row i, column j moves to row j, column i. No products happen. The shape swaps: a 2×3 table becomes a 3×2 table. Rows of the original are columns of the transpose.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>(Aᵀ)ᵢⱼ = Aⱼᵢ</span>
        </Board>
        <Prose>The subscripts trade places. That is the whole definition. People transpose so that a row they have stored becomes the column a matrix product expects to dot with.</Prose>
        {symbols([
          ["Aᵀ", "A, flipped"],
          ["i j → j i", "the entry moves, the number does not change"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="flex flex-wrap gap-6">
          <MatrixCells label="A" rows={matrix} onChange={setMatrix} highlightRow={row} highlightCol={col} />
          <MatrixCells label="Aᵀ" rows={flipped} highlightRow={col} highlightCol={row} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Scalar label="Row i in A" value={row} onChange={(value) => setRow(Math.round(value))} min={0} max={matrix.length - 1} step={1} />
          <Scalar label="Column j in A" value={col} onChange={(value) => setCol(Math.round(value))} min={0} max={matrix[0].length - 1} step={1} />
        </div>
        <p className="text-sm text-slate-700">
          A row {row + 1}, column {col + 1} is <Num value={matrix[row][col]} tone="blue" />. The same number in Aᵀ is row {col + 1}, column {row + 1}: <Num value={flipped[col][row]} tone="green" />.
        </p>
        <Goal met={row !== col}>Pick a cell off the diagonal, with row different from column, and watch it land on the other side of the diagonal.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Keys are stored as rows because each row is one token. A matrix product dots a row with columns. Transposing K turns “key number j” into column j. The query is a row. One product then dots that query with every key.
        </Prose>
        <p className="text-sm text-slate-700">
          q = (2, 0.5). Keys are (1, 0), (0.5, 1), (1, 1). By hand the scores are {byHand.map((value) => fmt(value)).join(", ")}. The single product q Kᵀ gives {batched.map((value) => fmt(value)).join(", ")}. Same numbers. The transpose did not change a key. It changed which way the table faces.
        </p>
        <Prose>The backward pass of y = Wx multiplies by Wᵀ for the same reason: the Jacobian wants columns where the forward pass stored rows. The Jacobian lesson does that multiply with a loss attached.</Prose>
      </Section>
    </Frame>
  );
}

export function RankLesson() {
  const u: [number, number] = [2, 0.8];
  const [angle, setAngle] = useState(70);
  const [mix, setMix] = useState(0);
  const [target, setTarget] = useState<[number, number]>([1.2, 1.6]);
  const radians = (angle * Math.PI) / 180;
  const free: [number, number] = [Math.cos(radians) * 2, Math.sin(radians) * 2];
  const v: [number, number] = [mix * u[0] + (1 - mix) * free[0], mix * u[1] + (1 - mix) * free[1]];
  const area = det2(u, v);
  const solved = solve2(u, v, target);
  const rebuilt = solved.a === null || solved.b === null ? null : [solved.a * u[0] + solved.b * v[0], solved.a * u[1] + solved.b * v[1]];
  const dependent = Math.abs(area) < 0.08;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A linear combination a u + b v can land anywhere in the plane when u and v point different ways. If v is a scale of u, every combination lands on the same line, and the layer has lost a direction. That count of usable directions is the rank. In the plane, the determinant is the signed area of the parallelogram. Area 0 means rank 1 (or 0, if both arrows vanish).
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>det = ad − bc</span>
        </Board>
        <Prose>For columns (a, c) and (b, d), multiply the diagonal pair and subtract the anti-diagonal pair. The sign says which arrow is clockwise of the other. The absolute value is the area. Rank is 2 when the area is not zero.</Prose>
        {symbols([
          ["u, v", "the two columns, drawn as arrows"],
          ["ad − bc", "the signed area"],
          ["a u + b v", "every output this layer can make"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid items-center gap-4 lg:grid-cols-[auto_1fr]">
          <VectorPlane
            vectors={[
              { x: u[0], y: u[1], color: "#1d4ed8", label: "u" },
              { x: v[0], y: v[1], color: "#b45309", label: "v" },
            ]}
            polygon={[
              { x: 0, y: 0 },
              { x: u[0], y: u[1] },
              { x: u[0] + v[0], y: u[1] + v[1] },
              { x: v[0], y: v[1] },
            ]}
            marker={{ x: target[0], y: target[1] }}
            onPick={(x, y) => setTarget([Number(x.toFixed(2)), Number(y.toFixed(2))])}
          />
          <div className="space-y-3">
            <Scalar label="Direction of the free arrow, degrees" value={angle} onChange={setAngle} min={0} max={180} step={1} />
            <Scalar label="How much v copies u" value={mix} onChange={setMix} min={0} max={1} step={0.01} note="At 1, v is a copy of u and the blue parallelogram has no area." />
            <p className="text-sm text-slate-700">
              u = ({fmt(u[0])}, {fmt(u[1])}), v = ({fmt(v[0])}, {fmt(v[1])}). det = <Num value={u[0]} tone="blue" />×<Num value={v[1]} tone="amber" /> − <Num value={u[1]} tone="blue" />×<Num value={v[0]} tone="amber" /> = <Num value={u[0] * v[1]} /> − <Num value={u[1] * v[0]} /> = <Num value={area} tone="green" />.
            </p>
            <p className="text-sm text-slate-700">Rank is {dependent ? "1. The two columns are the same direction." : "2. The columns point different ways."}</p>
          </div>
        </div>
        <Goal met={dependent}>Drag “copies u” to 1, or aim the free arrow along u (about 22°). The area falls to 0.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Click the plane to place a target output p. The layer can produce p when p = a u + b v for some scales a and b. A weight matrix whose columns are dependent cannot represent two independent features. A bottleneck that squeezes a wide vector through a short one is this fact used on purpose: the rank is at most the short dimension.
        </Prose>
        {solved.a !== null && solved.b !== null && rebuilt ? (
          <p className="text-sm text-slate-700">
            p = ({fmt(target[0])}, {fmt(target[1])}) = <Num value={solved.a} /> u + <Num value={solved.b} /> v. Check the first coordinate: <Num value={solved.a} />×<Num value={u[0]} /> + <Num value={solved.b} />×<Num value={v[0]} /> = <Num value={rebuilt[0]} tone="green" />.
          </p>
        ) : (
          <p className="text-sm text-slate-700">
            There is no unique pair (a, b). Outputs can only lie on the line through u. A target off that line is a feature this layer cannot say.
          </p>
        )}
      </Section>
    </Frame>
  );
}

export function EigenLesson() {
  const matrix: [[number, number], [number, number]] = [
    [2, 1],
    [1, 2],
  ];
  const [degrees, setDegrees] = useState(10);
  const radians = (degrees * Math.PI) / 180;
  const vector: [number, number] = [Math.cos(radians), Math.sin(radians)];
  const image = apply2(matrix, vector);
  const cross = vector[0] * image[1] - vector[1] * image[0];
  const rayleigh = dot(image, vector) / dot(vector, vector);
  const [lambdaLarge, lambdaSmall] = symEigen(2, 1, 2);
  const aligned = Math.abs(cross) < 0.05;
  let walking: [number, number] = vector;
  const steps = [walking];
  for (let count = 0; count < 4; count += 1) {
    walking = apply2(matrix, walking);
    steps.push(walking);
  }
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          Multiplying by a matrix moves arrows. Most arrows change direction. An eigenvector does not: the output is the input stretched by a single number λ, the eigenvalue. Apply the matrix again and you multiply by λ again. The larger |λ| takes over a repeated product, which is why one direction can dominate a deep stack of linear maps.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>A v = λ v</span>
        </Board>
        <Prose>
          This matrix is fixed, symmetric, and the kind a covariance matrix is: [[2, 1], [1, 2]]. Its characteristic polynomial is (2 − λ)² − 1² = λ² − 4λ + 3 = (λ − 3)(λ − 1). The roots are λ = 3 and λ = 1. The matching directions are (1, 1) and (1, −1). You rotate v and watch for the output to land on top of v.
        </Prose>
        {symbols([
          ["A", "the matrix doing the moving"],
          ["v", "the arrow you rotate"],
          ["λ", "how many times longer the output is, when the direction holds"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid items-center gap-4 lg:grid-cols-[auto_1fr]">
          <VectorPlane
            vectors={[
              { x: vector[0], y: vector[1], color: "#1d4ed8", label: "v" },
              { x: image[0], y: image[1], color: "#059669", label: "Av" },
            ]}
          />
          <div className="space-y-3">
            <Scalar label="Angle of v, degrees" value={degrees} onChange={setDegrees} min={-180} max={180} step={1} />
            <p className="text-sm text-slate-700">
              v = ({fmt(vector[0])}, {fmt(vector[1])}). Av = (2 v₁ + v₂, v₁ + 2 v₂) = ({fmt(image[0])}, {fmt(image[1])}).
            </p>
            <p className="text-sm text-slate-700">
              Cross product vₓ Avᵧ − vᵧ Avₓ = <Num value={cross} />. It is zero exactly when the arrows are parallel. The stretch this v feels is (Av · v) / (v · v) = <Num value={rayleigh} tone="green" />. The real eigenvalues are <Num value={lambdaLarge} /> and <Num value={lambdaSmall} />.
            </p>
            <Goal met={aligned}>Rotate to 45° or to −45°. Those are the eigenvectors. The felt stretch snaps to 3 or to 1, and the cross product vanishes.</Goal>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pr-4">Apply A</th>
                <th className="pr-4">vector</th>
                <th>length</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => (
                <tr key={index} className="font-mono">
                  <td className="pr-4">{index}</td>
                  <td className="pr-4">({fmt(step[0])}, {fmt(step[1])})</td>
                  <td>{fmt(norm(step))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>Each row is A applied to the row above. Unless you started exactly on (1, −1), the arrow swings toward (1, 1) and the length starts tripling, because 3 beats 1.</Prose>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Principal component analysis builds the covariance of the data, which is symmetric, and keeps the eigenvectors with the large eigenvalues. Those are the directions the data already stretches. A stack of linear maps does the same kind of selection by accident: repeated multiplication amplifies the largest |λ| and buries the others. Training has to keep those stretches from running away. Symmetric matrices have real eigenvalues; a general matrix can rotate without a real eigenvector, which is why the general tool is the singular value decomposition. The idea you need first is the one on this page: a direction, and a stretch.
        </Prose>
      </Section>
    </Frame>
  );
}

export function QuadraticLesson() {
  const matrix: [[number, number], [number, number]] = [
    [2, 0.5],
    [0.5, 1],
  ];
  const [vector, setVector] = useState([1.2, -0.6]);
  const [lambda, setLambda] = useState(0);
  const x1 = vector[0];
  const x2 = vector[1];
  const terms = [
    { name: "x₁ A₁₁ x₁", value: x1 * matrix[0][0] * x1 },
    { name: "x₁ A₁₂ x₂", value: x1 * matrix[0][1] * x2 },
    { name: "x₂ A₂₁ x₁", value: x2 * matrix[1][0] * x1 },
    { name: "x₂ A₂₂ x₂", value: x2 * matrix[1][1] * x2 },
  ];
  const total = terms.reduce((sum, term) => sum + term.value, 0);
  const best = 2 / (1 + lambda);
  const decayLoss = (w: number) => (w - 2) ** 2 + lambda * w * w;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A quadratic form uses every pair of entries. Take all products xᵢ Aᵢⱼ xⱼ and add them. When A is symmetric, the two cross terms are the same kind of product and they combine. If both eigenvalues are positive, the result is positive for every arrow except the zero arrow, and the surface has a single bottom at the origin.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>xᵀ A x = Σᵢⱼ xᵢ Aᵢⱼ xⱼ</span>
        </Board>
        <Prose>
          For this 2×2 matrix the four terms collapse, because A₁₂ = A₂₁ = 0.5, into 2 x₁² + x₂² + x₁ x₂. The matrix is [[2, 0.5], [0.5, 1]]. Both eigenvalues are positive, so this is a bowl.
        </Prose>
        {symbols([
          ["xᵀ", "x written as a row, so the product is one number"],
          ["Aᵢⱼ", "the number in the table that pairs entry i with entry j"],
          ["bowl", "every direction costs something, except staying at 0"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <VectorEditor label="x" hint="The point on the bowl." values={vector} onChange={setVector} min={-2} max={2} />
        <ul className="space-y-1 font-mono text-sm">
          {terms.map((term) => (
            <li key={term.name}>
              {term.name} = <Num value={term.value} tone="green" />
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-700">
          Combined polynomial at these numbers: 2×({fmt(x1)})² + ({fmt(x2)})² + ({fmt(x1)})({fmt(x2)}) = <Num value={2 * x1 * x1} /> + <Num value={x2 * x2} /> + <Num value={x1 * x2} /> = <Num value={total} tone="green" />.
        </p>
        <Heatmap
          f={(x, y) => 2 * x * x + y * y + x * y}
          x={x1}
          y={x2}
          xMin={-2}
          xMax={2}
          yMin={-2}
          yMax={2}
          onPick={(x, y) => setVector([x, y])}
          caption="Pale is a low value. The bottom is the origin. Click to move x."
        />
        <Goal met={Math.abs(x1) < 0.15 && Math.abs(x2) < 0.15}>Move x to the origin. That is the only place this bowl is zero.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A linear model’s squared error, with the data held fixed, is a bowl in the weights. Weight decay adds λ w², a bowl whose bottom is the zero vector. The best weight is a compromise between fitting the target and staying small. Here the unaided best weight is 2, and the decayed loss is (w − 2)² + λ w². Set the derivative 2(w − 2) + 2λ w to zero and the best weight is 2 / (1 + λ).
        </Prose>
        <Scalar label="λ, the strength of the pull toward zero" value={lambda} onChange={setLambda} min={0} max={4} step={0.1} />
        <p className="text-sm text-slate-700">
          Best w = 2 / (1 + <Num value={lambda} />) = <Num value={best} tone="green" />. Loss there is <Num value={decayLoss(best)} />. At λ = 0 the best weight is the target, 2. As λ grows, the answer is dragged toward 0 and the data fit gets worse on purpose.
        </p>
      </Section>
    </Frame>
  );
}
