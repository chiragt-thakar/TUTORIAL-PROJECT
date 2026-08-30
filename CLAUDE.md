# Curriculum work reference

This is the only instruction/status file to read for normal curriculum tasks. Keep it short.
The complete application roadmap remains in `content/roadmap/AI_ML_MASTERY_ROADMAP.md` because the
site parses it; do not load that large file unless this checklist must advance beyond Phase 1.

## Choose the model manually

Select the model below in the ChatGPT/Codex composer **before** sending the task. Repository code
cannot change the model used by the current chat.

- **Sol (`gpt-5.6-sol`)**: deep internals, derivations, numerical reasoning, hard debugging.
- **Terra (`gpt-5.6-terra`)**: library APIs, routine lessons, projects, and normal code work.
- **Luna (`gpt-5.6-luna`)**: small formatting or metadata corrections only; not a full lesson.

Use the closest available equivalent if the exact model is not shown on the account.

## One-topic workflow

When asked to “implement next”:

1. Implement only the `NEXT` topic below. Read its `module.json` entry and the latest existing
   `.mdx` + `.practice.yaml` pair in that module; do not read every project Markdown file.
2. Keep the roadmap `id` and exact title unchanged. Add real metadata and set only that lesson to
   `status: "available"`; keep an incomplete module `planned`.
3. Author from scratch. Do not copy Extra Learning prose unless the user explicitly asks.
4. The MDX needs matching frontmatter, deep teaching from basics through internals/performance,
   useful JS/TS comparisons, five inline exercise difficulties, Checkpoint, Gotchas, and Summary.
5. The practice YAML target is 14 distinct exercises across all four tiers, 2+ hints each,
   3+ debug, 1+ code-reading, a 4-question checkpoint, 10-question assessment, 6+ interviews,
   a realistic major project, final challenge, and 5 verified primary resources.
6. Quote YAML values containing backticks, `: `, or boolean-like strings.
7. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.
   Confirm all seven generated tabs: Learn, Practice, Debug, Interview, Test, Project, Review.
8. After success, strike through the completed topic here and move `NEXT` to the following topic.

## Phase 1 topic status and recommended model

### 1.1 Python fluency beyond the basics — complete

- [x] ~~Data model: `__dunder__` methods, descriptors, `__slots__`~~ — Sol
- [x] ~~Iterators, generators, `yield from`, lazy evaluation~~ — Sol
- [x] ~~Decorators, closures, `functools`~~ — Terra
- [x] ~~Context managers and `contextlib`~~ — Terra
- [x] ~~Type hints: `Generic`, `TypeVar`, `Protocol`, `Literal`, `overload`~~ — Sol
- [x] ~~`dataclasses` vs Pydantic v2~~ — Terra
- [x] ~~Exceptions, custom hierarchies, exception groups~~ — Sol
- [x] ~~`asyncio`, tasks, semaphores, backpressure~~ — Sol
- [x] ~~GIL, multiprocessing, and `concurrent.futures`~~ — Sol
- [x] ~~Packaging with `uv` and `pyproject.toml`~~ — Terra
- [x] ~~Testing with pytest and Hypothesis~~ — Terra
- [x] ~~Ruff, strict mypy, and pre-commit~~ — Terra

### 1.2 NumPy — complete

- [x] ~~`ndarray` memory layout: strides, contiguity, views vs copies~~ — Sol
- [x] ~~`dtype`, precision, float32, float64, bfloat16~~ — Sol
- [x] ~~Broadcasting rules — derive them, don't memorise them~~ — Sol
- [x] ~~Fancy indexing, boolean masking, `np.where`~~ — Terra
- [x] ~~Axis semantics — the #1 source of silent bugs in ML code~~ — Sol
- [x] ~~Reductions, `keepdims`, and why it prevents broadcasting bugs~~ — Sol
- [x] ~~`einsum` — learn it properly, it will make you read papers faster~~ — Sol
- [x] ~~Linear algebra: `matmul`, `solve`, `inv`, `svd`, `eig`~~ — Sol
- [x] ~~Random number generation and reproducibility~~ — Terra
- [x] ~~Vectorisation and measuring speedup~~ — Terra

### 2.1 Linear Algebra — the language of ML — complete

- [x] ~~Vectors, vector spaces, span, basis, dimension, linear independence~~ — Sol
- [x] ~~Matrices as linear transformations (geometric view first, always)~~ — Sol
- [x] ~~Matrix multiplication — four different mental models of it~~ — Sol
- [x] ~~Transpose, inverse, pseudo-inverse, determinant, trace, rank~~ — Sol
- [x] ~~Systems of linear equations, Gaussian elimination, LU decomposition~~ — Sol
- [x] ~~Inner products, norms (L0/L1/L2/L∞/Frobenius), orthogonality, projections~~ — Sol
- [x] ~~Gram–Schmidt, QR decomposition~~ — Sol
- [x] ~~Eigenvalues, eigenvectors, eigendecomposition, diagonalisation~~ — Sol
- [x] ~~Symmetric matrices, positive (semi-)definiteness — critical for optimisation~~ — Sol
- [x] ~~Singular Value Decomposition (SVD) — the single most useful decomposition in ML~~ — Sol
- [x] ~~Low-rank approximation — this is literally what LoRA is~~ — Sol
- [x] ~~Matrix calculus: Jacobians, gradients, layout conventions, chain rule for matrices~~ — Sol
- [x] ~~Tensors: what they actually are vs. what PyTorch calls them~~ — Sol
- [x] ~~Computational cost: FLOPs of matmul, memory layout, why batching wins~~ — Sol

### 2.2 Calculus & Optimisation — in progress

- [x] ~~Limits, continuity, derivatives — refresh only~~ — Terra
- [x] ~~Chain rule — deeply, in multiple variables. Backprop is this and nothing more.~~ — Sol
- [x] ~~Partial derivatives, gradients, directional derivatives~~ — Sol
- [x] ~~Jacobian, Hessian; what the Hessian tells you about curvature~~ — Sol
- [x] ~~Taylor expansion (1st and 2nd order) — the basis of every optimiser~~ — Sol
- [x] ~~Critical points, saddle points, local vs global minima~~ — Sol
- [x] ~~Convexity, convex sets, convex functions, why convexity is nice and why DL isn't convex~~ — Sol
- [x] ~~Lagrange multipliers, KKT conditions, constrained optimisation~~ — Sol
- [ ] Gradient descent: batch, stochastic, mini-batch — Sol ← **NEXT**
- [ ] Momentum, Nesterov, AdaGrad, RMSProp, Adam, AdamW — derive each update rule — Sol
- [ ] Learning rate schedules: cosine, warmup, one-cycle, and why warmup exists — Terra
- [ ] Second-order methods: Newton, quasi-Newton, L-BFGS — and why we don't use them at scale — Sol
- [ ] Numerical stability: catastrophic cancellation, log-sum-exp trick, gradient clipping — Sol

### 1.3 The scientific stack — complete

- [x] ~~pandas: indexing, groupby, merges, reshaping, time series, MultiIndex~~ — Terra
- [x] ~~polars for large data~~ — Terra
- [x] ~~matplotlib Figure/Axes model~~ — Terra
- [x] ~~seaborn for statistical plots~~ — Terra
- [x] ~~scipy: stats, optimize, linalg, sparse~~ — Sol
- [x] ~~Jupyter discipline~~ — Terra

When Phase 1 is complete, replace this completed section with a one-line summary and copy only the
next active phase's topics from the canonical roadmap. This keeps this file small over time.
