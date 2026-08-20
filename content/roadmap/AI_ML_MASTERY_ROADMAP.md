# The AI/ML Mastery Roadmap — Beginner to Top 1%

> **Provenance.** This document is the learner's own roadmap, supplied verbatim on 2026-08-20 and
> stored here as the curriculum's source of truth. Do not paraphrase, compress, reorder, or "improve"
> it. Every phase, section, checkbox, resource, and Proof Gate below is load-bearing and must survive
> into `content/roadmap.json` and the curriculum modules generated from it. Additions are allowed;
> deletions are not.
>
> **COMPLETE.** Assembled from three paste attempts (the first two were cut off by a
> 50,000-character input limit) and verified section by section on 2026-08-20. No TRUNCATED marker
> remains; if one is ever added back, the parser flags the document as incomplete again.

**Built for:** Chirag Thaker — Backend Engineer (Node/TS, PostgreSQL, Kafka, Docker, IoT/SCADA) → Production AI Engineer
**Built on:** 20 August 2026
**Honest duration:** 24–30 months at 12–15 focused hours/week. Not 6 months. Anyone who tells you 6 months is selling something.

---

## READ THIS BEFORE THE ROADMAP

You asked me to be honest, so three things first. If you skip this section, the rest of the document will hurt you instead of helping you.

### 1. You cannot blindly follow this. Nobody can.

A roadmap is a **skeleton**. Roughly 60% of what makes someone top-1% comes from the parts no roadmap can contain: the debugging you do at 1am when your loss goes to NaN, the decision about whether your eval set is actually measuring the thing you care about, the judgement call about when to stop tuning and ship.

What this roadmap *can* do is guarantee you never study the wrong thing, never study things in the wrong order, and never have a hole in your foundations. That is worth a lot. It is not the same as guaranteeing mastery.

**Practical rule:** if you finish a phase and the only evidence is checked boxes, you did not finish the phase. Every phase has a **Proof Gate**. The gate is the real checkbox.

### 2. "Master everything" is the single most common way to end up mediocre at all of it.

Data Scientist, ML Researcher, and AI Engineer are three different jobs with three different daily activities and three different hiring bars. The people earning the top-percentile money are **deep in one lane and literate in the others** — never evenly spread.

Given your actual background — production backend, high-volume telemetry, Postgres, Kafka, event-driven systems, a running RAG project — your highest-leverage spine is:

> **AI / ML Platform Engineer → Applied ML + LLM Systems Engineer**
>
> The person who can take a model from research artifact to a system that serves real traffic, costs a known amount, fails safely, and has evals proving it works.

This is deliberately chosen because it *compounds* your existing five years of backend instincts rather than discarding them. A fresh CS grad cannot compete with you on distributed systems, database internals, or production reliability. They can compete with you on "I did a Kaggle notebook."

You will still learn statistics, classical ML, deep learning, and training/fine-tuning **properly and deeply** — they are in this roadmap in full. But you learn them as a systems engineer who understands models, not as a data scientist who tolerates infrastructure. That framing changes what you optimise for at every step.

If after Phase 4 you fall in love with the research side and want to pivot the spine to ML Research or pure Data Science, that's a legitimate choice — but make it consciously, once, and then commit.

### 3. "Future proof for 5 years" is possible — but only for the core.

Here is the honest split. Print this. It is the most valuable table in this document.

| **Durable core (5–15 year shelf life)** | **Churn layer (12–24 month shelf life)** |
|---|---|
| Linear algebra, probability, statistics, optimisation | Specific frameworks (LangChain, LlamaIndex, whatever's next) |
| Backpropagation, gradient descent, loss landscapes | Specific model names (GPT-x, Claude-x, Llama-x) |
| The transformer/attention computation itself | Specific serving libraries (vLLM, SGLang, TGI) |
| Tokenisation, embeddings, sampling | Specific vector DBs (pgvector, Pinecone, Qdrant) |
| Bias–variance, generalisation, regularisation | Specific fine-tuning wrappers (Axolotl, Unsloth) |
| Evaluation design & experiment design | Prompt-engineering "tricks" |
| Distributed systems, data engineering, reliability | Agent framework APIs |
| Scaling laws, compute/memory tradeoffs | Context window sizes and pricing |
| Information theory, entropy, KL divergence | Benchmark leaderboards |
| Security, privacy, adversarial thinking | Specific cloud AI services |

**The rule:** spend ~70% of your study time on the left column and ~30% on the right. Most people invert this, which is exactly why they need a new roadmap every 18 months. The left column is why a strong engineer in 2019 could absorb transformers in a month while a "prompt engineer" in 2026 has nothing to stand on.

Every phase below is tagged `[CORE]` or `[TOOL]` so you always know which column you're spending time in.

---

## HOW TO USE THIS DOCUMENT

**Weekly cadence (12–15 hrs):**
- 4 hrs — **Math track** (runs in parallel from day one, never as a blocking prerequisite)
- 6 hrs — **Current phase's main track**
- 3 hrs — **Build** (the phase project)
- 1 hr — **Paper / review** (Sunday: re-derive something from three weeks ago, from memory, on paper)

**The parallel-track rule.** Do NOT do "12 months of math, then start ML." That is how people quit. Math track and build track run simultaneously, always. You will understand eigenvectors far better after you have watched PCA fail on your own data than before.

**The 3-pass rule for hard topics.** Pass 1: watch/read for intuition, accept confusion. Pass 2: derive it on paper. Pass 3: implement it from scratch in NumPy. A topic is not learned until pass 3. This is slower than what most people do and it is the entire difference.

**One resource per topic.** I have picked exactly one primary resource per topic — not a list. Finish it before looking at alternatives. Resource-shopping is procrastination with good PR.

**Progress tracking.** Keep this file in a git repo. Commit every time you tick a box, with the commit message describing what you actually built or derived. In 24 months that git log *is* your evidence.

**When you get stuck for more than 90 minutes:** stop, write down the exact question, move to a different track, come back tomorrow. Stuck-time is not study-time.

---

## PHASE 0 — Audit What You Already Have `[CORE]` — 1 week

You are not starting at zero. Most of this phase is confirming and closing gaps, not learning.

**Already solid (verify, don't restudy):**
- [ ] JavaScript/TypeScript, Node, Express/Fastify — ✅ skip
- [ ] PostgreSQL, indexing, query planning, transactions — ✅ skip
- [ ] Redis, Kafka, BullMQ, event-driven architecture — ✅ skip
- [ ] Docker, Git, REST API design — ✅ skip
- [ ] High-volume telemetry, multi-tenancy, RBAC — ✅ skip (this is a genuine differentiator, keep it visible)

**Honest self-test — tick only if you can do it without looking anything up:**
- [ ] Write a Python generator, a decorator, and a context manager from memory
- [ ] Explain the difference between a process, a thread, and an asyncio task in Python specifically
- [ ] Explain what a GIL is and when it does and doesn't matter
- [ ] Take the derivative of `f(x) = x²·sin(x)` on paper
- [ ] Multiply two 3×3 matrices by hand, and say what the result *means* geometrically
- [ ] Explain what a p-value actually is, correctly, in one sentence
- [ ] Explain overfitting without using the word "overfitting"
- [ ] Explain why your existing RAG system retrieves the wrong chunk sometimes — mechanically, not hand-wavily

Whatever you couldn't tick tells you where to press harder in Phases 1–3.

**Proof Gate:** a written, honest one-page assessment of your gaps committed to the repo. Date it. You'll re-read it in month 12 and it will be motivating.

---

## PHASE 1 — Python as an ML Engineer's Language `[CORE + TOOL]` — 3–4 weeks

You know programming. You do not yet know Python *the way numerical code needs it*. This phase is short but do not skip it — everything downstream is written in it.

### 1.1 Python fluency beyond the basics
- [ ] Data model: `__dunder__` methods, descriptors, `__slots__`
- [ ] Iterators, generators, `yield from`, lazy evaluation
- [ ] Decorators, closures, `functools` (`lru_cache`, `partial`, `wraps`)
- [ ] Context managers and `contextlib`
- [ ] Type hints in depth: `Generic`, `TypeVar`, `Protocol`, `Literal`, `overload`
- [ ] `dataclasses` vs Pydantic v2 — when each is correct
- [ ] Exceptions, custom exception hierarchies, exception groups
- [ ] `asyncio`: event loop, tasks, `gather`, semaphores, backpressure
- [ ] Concurrency reality: GIL, `multiprocessing`, `concurrent.futures`, when to use which
- [ ] Packaging: `uv`, `pyproject.toml`, editable installs, dependency pinning
- [ ] Testing: `pytest` fixtures, parametrize, mocking, property-based testing with `hypothesis`
- [ ] Tooling: `ruff`, `mypy` strict mode, `pre-commit`

> **Resource:** *Fluent Python*, 2nd edition — Luciano Ramalho. Read chapters 1–7, 14–21. This is the only Python book worth your time given your experience level.

### 1.2 NumPy — the actual foundation `[CORE]`
This is not "a library." Every tensor operation you will ever write is a NumPy idea wearing a different name.
- [ ] `ndarray` memory layout: strides, contiguity, views vs copies
- [ ] `dtype`, precision, float32 vs float64 vs bfloat16 — and why it matters for training
- [ ] Broadcasting rules — derive them, don't memorise them
- [ ] Fancy indexing, boolean masking, `np.where`
- [ ] Axis semantics — the #1 source of silent bugs in ML code
- [ ] Reductions, `keepdims`, and why it prevents broadcasting bugs
- [ ] `einsum` — learn it properly, it will make you read papers faster
- [ ] Linear algebra ops: `matmul`, `solve`, `inv`, `svd`, `eig`
- [ ] Random number generation and seeding for reproducibility
- [ ] Vectorisation: rewriting loops as array ops, and measuring the speedup

> **Resource:** NumPy's own "NumPy fundamentals" docs + *From Python to NumPy* (Nicolas Rougier, free online). Do every exercise in Rougier.

### 1.3 The scientific stack `[TOOL]`
- [ ] `pandas`: Series/DataFrame, indexing (`loc`/`iloc`), groupby-apply-agg, merges, reshaping (`melt`/`pivot`), time series, `MultiIndex`
- [ ] `polars` — learn it after pandas; it's what you'll actually reach for on large data
- [ ] `matplotlib`: the Figure/Axes object model (not `plt.` state-machine style)
- [ ] `seaborn` for statistical plots
- [ ] `scipy`: `stats`, `optimize`, `linalg`, `sparse`
- [ ] Jupyter discipline: notebooks for exploration only, never for production logic

> **Resource:** *Python for Data Analysis*, 3rd edition — Wes McKinney (free online). Chapters 5–11.

**Proof Gate — Phase 1:**
Build a small library, packaged with `uv`, fully typed, `mypy --strict` clean, 90%+ test coverage, that implements from scratch in pure NumPy: `mean`, `std`, `cov`, `corr`, PCA, k-means, and a linear regression via both the normal equation and gradient descent. No sklearn. Benchmark against sklearn and explain any numerical differences you find.

---

## PHASE 2 — Mathematics `[CORE]` — runs in parallel, 5–7 months of the 4hr/week slot

This is the phase that separates the top 1% from the top 20%, and it is the phase everyone skips. You do not need a maths degree. You need to be able to **read a paper's equations and implement them**, and to **debug a model by reasoning about what the numbers are doing**.

Do not front-load this. 4 hrs/week, every week, forever, in parallel with everything else.

### 2.1 Linear Algebra — the language of ML
- [ ] Vectors, vector spaces, span, basis, dimension, linear independence
- [ ] Matrices as linear transformations (geometric view first, always)
- [ ] Matrix multiplication — four different mental models of it
- [ ] Transpose, inverse, pseudo-inverse, determinant, trace, rank
- [ ] Systems of linear equations, Gaussian elimination, LU decomposition
- [ ] Inner products, norms (L0/L1/L2/L∞/Frobenius), orthogonality, projections
- [ ] Gram–Schmidt, QR decomposition
- [ ] Eigenvalues, eigenvectors, eigendecomposition, diagonalisation
- [ ] Symmetric matrices, positive (semi-)definiteness — critical for optimisation
- [ ] Singular Value Decomposition (SVD) — the single most useful decomposition in ML
- [ ] Low-rank approximation — **this is literally what LoRA is**
- [ ] Matrix calculus: Jacobians, gradients, the layout conventions, chain rule for matrices
- [ ] Tensors: what they actually are vs. what PyTorch calls them
- [ ] Computational cost: FLOPs of matmul, memory layout, why batching wins

> **Resource:** *Mathematics for Machine Learning* — Deisenroth, Faisal & Ong (free PDF). Chapters 2–4.
> **Watch first for intuition (3 hrs total):** 3Blue1Brown, *Essence of Linear Algebra*. Then read the book. The video is the map; the book is the terrain.

### 2.2 Calculus & Optimisation
- [ ] Limits, continuity, derivatives — refresh only
- [ ] Chain rule — deeply, in multiple variables. Backprop is this and nothing more.
- [ ] Partial derivatives, gradients, directional derivatives
- [ ] Jacobian, Hessian; what the Hessian tells you about curvature
- [ ] Taylor expansion (1st and 2nd order) — the basis of every optimiser
- [ ] Critical points, saddle points, local vs global minima
- [ ] Convexity, convex sets, convex functions, why convexity is nice and why DL isn't convex
- [ ] Lagrange multipliers, KKT conditions, constrained optimisation
- [ ] Gradient descent: batch, stochastic, mini-batch
- [ ] Momentum, Nesterov, AdaGrad, RMSProp, Adam, AdamW — derive each update rule
- [ ] Learning rate schedules: cosine, warmup, one-cycle, and *why* warmup exists
- [ ] Second-order methods: Newton, quasi-Newton, L-BFGS — and why we don't use them at scale
- [ ] Numerical stability: catastrophic cancellation, log-sum-exp trick, gradient clipping

> **Resource:** *Mathematics for Machine Learning*, chapters 5 & 7. Then implement every optimiser above from scratch in NumPy and race them on the same loss surface. Plot the trajectories.

### 2.3 Probability — the language of uncertainty
- [ ] Sample spaces, events, axioms of probability
- [ ] Conditional probability, independence, Bayes' theorem
- [ ] Random variables: discrete and continuous
- [ ] PMF, PDF, CDF, quantile function
- [ ] Expectation, variance, covariance, correlation, moments
- [ ] Key distributions and *when each arises*: Bernoulli, Binomial, Categorical, Multinomial, Poisson, Uniform, Gaussian, Exponential, Beta, Gamma, Dirichlet, Laplace
- [ ] Multivariate Gaussian — the covariance matrix geometry
- [ ] Joint, marginal, conditional distributions
- [ ] Law of Large Numbers, Central Limit Theorem — and their limits
- [ ] Change of variables, Jacobian in probability
- [ ] Markov chains, stationary distributions
- [ ] Monte Carlo methods, importance sampling, MCMC (conceptually)
- [ ] Maximum Likelihood Estimation, Maximum A Posteriori
- [ ] Conjugate priors, Bayesian updating

> **Resource:** *Introduction to Probability* — Blitzstein & Hwang, plus the Harvard Stat 110 lectures on YouTube (free). This is the best probability course that exists at any price.

### 2.4 Statistics & Experiment Design
- [ ] Populations vs samples, sampling distributions, standard error
- [ ] Point estimation: bias, variance, consistency, efficiency, MSE decomposition
- [ ] Confidence intervals — and the correct interpretation
- [ ] Hypothesis testing: null/alternative, test statistic, p-value (the *correct* definition), Type I/II error, power
- [ ] t-test, chi-squared, ANOVA, non-parametric tests
- [ ] Multiple comparisons, Bonferroni, FDR / Benjamini–Hochberg
- [ ] Bootstrap and permutation tests — often better than the parametric version
- [ ] Linear regression from a statistical view: assumptions, residual analysis, heteroscedasticity, multicollinearity
- [ ] Logistic regression, GLMs, link functions
- [ ] Regularisation as a prior: ridge = Gaussian prior, lasso = Laplace prior
- [ ] Causal inference basics: correlation vs causation, confounders, Simpson's paradox, RCTs, DAGs
- [ ] A/B testing: sample size calculation, sequential testing, peeking problem, novelty effects
- [ ] Bayesian vs frequentist framing — and when each is the right tool

> **Resource:** *All of Statistics* — Larry Wasserman, chapters 1–13. Dense, fast, exactly the right level for an engineer. If you want the Bayesian worldview afterwards, *Statistical Rethinking* (McElreath) is the best book, but treat it as a bonus.

### 2.5 Information Theory
- [ ] Entropy, joint entropy, conditional entropy
- [ ] Mutual information
- [ ] Cross-entropy — **the loss function you'll use most of your career**
- [ ] KL divergence, forward vs reverse KL, and why the asymmetry matters (this is at the heart of RLHF/DPO)
- [ ] Jensen–Shannon divergence
- [ ] Perplexity — and why it's just exponentiated cross-entropy
- [ ] Source coding, compression as prediction
- [ ] The "compression = intelligence" argument, and its critics

> **Resource:** *Information Theory, Inference, and Learning Algorithms* — David MacKay (free PDF), chapters 1–6. Also the best-written technical book on this list.

### 2.6 Discrete Math & Algorithms (light, but non-negotiable)
- [ ] Big-O, time/space complexity analysis
- [ ] Graphs: representations, BFS/DFS, shortest paths, topological sort
- [ ] Dynamic programming
- [ ] Hashing, tree structures, heaps
- [ ] Approximate nearest neighbour algorithms: HNSW, IVF, product quantisation — **you use these every day in RAG and should know how they actually work**

> **Resource:** NeetCode 150, worked in Python. Not for interviews — for the habit of reasoning about cost.

**Proof Gate — Phase 2:**
Write and publish a set of Jupyter notebooks (one per subsection) where you *derive* the key results on paper (photograph/LaTeX them) and *implement* them in NumPy: SVD-based PCA, all six optimisers, MLE for three distributions, a bootstrap CI, an A/B test power calculation, and cross-entropy/KL from scratch. If you can teach these to someone else, you're done.

---

## PHASE 3 — Classical ML & Data Science `[CORE]` — 3 months

Everyone wants to skip this and go straight to LLMs. Don't. Two reasons that will cost you money if you ignore them:

1. **Most real business problems are still not LLM problems.** Fraud detection, churn, forecasting, ranking, anomaly detection in your SCADA telemetry — these are gradient boosting problems, and the person who can tell the difference is worth more than the person who reaches for an LLM every time.
2. **Every concept in deep learning is a classical ML concept scaled up.** If you don't understand the bias–variance tradeoff on a decision tree, you will not understand it on a 70B parameter model.

### 3.1 The ML problem framing
- [ ] Supervised / unsupervised / semi-supervised / self-supervised / reinforcement
- [ ] Regression vs classification vs ranking vs clustering vs density estimation
- [ ] The i.i.d. assumption and every way real data violates it
- [ ] Bias–variance decomposition — derive it algebraically
- [ ] Underfitting, overfitting, capacity, the double-descent phenomenon
- [ ] The curse of dimensionality
- [ ] No Free Lunch theorem and what it actually implies
- [ ] Inductive bias — every model has one; know each model's

### 3.2 Data work (this is 70% of the actual job)
- [ ] Data collection, sampling strategies, sampling bias
- [ ] Exploratory data analysis as a disciplined process, not random plotting
- [ ] Missing data: MCAR/MAR/MNAR, imputation strategies and their dangers
- [ ] Outlier detection and when *not* to remove them
- [ ] Feature engineering: scaling, standardisation, normalisation, binning, log transforms
- [ ] Categorical encoding: one-hot, ordinal, target encoding, hashing, embeddings
- [ ] Datetime and cyclical features
- [ ] Text features: bag-of-words, TF-IDF, n-grams (before embeddings — know what they replaced)
- [ ] Feature selection: filter, wrapper, embedded methods; permutation importance
- [ ] Handling imbalanced data: resampling, SMOTE, class weights, threshold tuning
- [ ] Data leakage — every kind. **This is the #1 silent killer of ML projects.**
- [ ] Train/validation/test splits; stratification; time-based splits for temporal data
- [ ] Cross-validation: k-fold, stratified, group, time-series CV

### 3.3 The models — for each: derive the objective, implement from scratch once, then use sklearn
- [ ] Linear regression (OLS, ridge, lasso, elastic net)
- [ ] Polynomial regression and basis expansion
- [ ] Logistic regression and softmax regression
- [ ] k-Nearest Neighbours
- [ ] Naive Bayes
- [ ] Support Vector Machines: margin, hinge loss, the kernel trick, RBF kernel
- [ ] Decision trees: Gini, entropy, information gain, pruning
- [ ] Ensembles — bagging: Random Forests, extra trees, out-of-bag error
- [ ] Ensembles — boosting: AdaBoost, Gradient Boosting, **XGBoost / LightGBM / CatBoost**
- [ ] Stacking and blending
- [ ] Clustering: k-means (+ k-means++), hierarchical, DBSCAN, Gaussian Mixture Models + EM
- [ ] Dimensionality reduction: PCA, kernel PCA, t-SNE, UMAP — and their failure modes
- [ ] Anomaly detection: isolation forest, one-class SVM, autoencoder-based
- [ ] Time series: stationarity, ACF/PACF, ARIMA, seasonal decomposition, Prophet, and why gradient boosting often beats all of them

### 3.4 Evaluation — the skill that most separates seniors from juniors
- [ ] Regression metrics: MSE, RMSE, MAE, MAPE, R², adjusted R² — and when each lies
- [ ] Classification metrics: accuracy, precision, recall, F1, F-beta
- [ ] Confusion matrix reasoning; choosing a threshold from business cost, not from 0.5
- [ ] ROC-AUC vs PR-AUC — and why PR-AUC is correct for imbalanced problems
- [ ] Calibration: reliability diagrams, Platt scaling, isotonic regression, Brier score
- [ ] Ranking metrics: MAP, MRR, NDCG (you'll need these for RAG retrieval evaluation)
- [ ] Clustering metrics: silhouette, Davies–Bouldin, adjusted Rand index
- [ ] Statistical significance of model comparisons — not "0.87 > 0.86"
- [ ] Error analysis: slicing performance by segment, finding where the model is actually broken
- [ ] Hyperparameter search: grid, random, Bayesian optimisation, Optuna, successive halving

### 3.5 Interpretability & fairness
- [ ] Global vs local interpretability
- [ ] Coefficients, feature importance, permutation importance
- [ ] Partial dependence plots, ICE plots
- [ ] SHAP (understand the Shapley value maths, not just the library)
- [ ] LIME
- [ ] Counterfactual explanations
- [ ] Fairness metrics: demographic parity, equalised odds, calibration within groups — and their mathematical incompatibility

> **Resources:**
> **Theory:** *An Introduction to Statistical Learning with Python* (ISLP) — free PDF. The clearest ML book ever written. Do every lab.
> **Practice:** *Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow*, 3rd ed — Aurélien Géron. Part I only (Part II is superseded by PyTorch work below).
> **Advanced reference (dip in, don't read cover to cover):** *The Elements of Statistical Learning* — Hastie, Tibshirani, Friedman.

**Proof Gate — Phase 3:**
Take a real, messy dataset — ideally from your own SCADA/telemetry domain, which nobody else on the internet has — and ship an end-to-end predictive service: EDA → feature pipeline → 3 model families compared with proper CV → calibrated probabilities → error analysis by segment → SHAP explanations → FastAPI service → Docker → monitoring. Write a README that argues *why* the model is trustworthy. This one project is worth more in an interview than any certificate.

---

## PHASE 4 — Deep Learning Foundations `[CORE]` — 3 months

### 4.1 Neural networks from scratch (do this before touching PyTorch)
- [ ] The perceptron and its limitations (XOR)
- [ ] Multi-layer perceptrons and the universal approximation theorem — and its uselessness in practice
- [ ] Forward pass as function composition
- [ ] **Backpropagation derived by hand** for a 2-layer network, then coded in raw NumPy
- [ ] Computational graphs and reverse-mode autodiff
- [ ] Build a working autograd engine yourself (scalar-valued is enough)
- [ ] Activation functions: sigmoid, tanh, ReLU, LeakyReLU, ELU, GELU, SiLU/Swish — and the gradient behaviour of each
- [ ] Loss functions: MSE, MAE, Huber, binary/categorical cross-entropy, focal loss
- [ ] Weight initialisation: why zeros fail, Xavier/Glorot, He initialisation — derive the variance argument

### 4.2 Training dynamics — the part that makes you employable
- [ ] Vanishing and exploding gradients
- [ ] Batch normalisation: what it does, the internal-covariate-shift story and why it's probably wrong
- [ ] Layer normalisation, RMSNorm; pre-norm vs post-norm
- [ ] Dropout and why it's a form of ensembling
- [ ] Weight decay vs L2 regularisation (they are NOT the same under Adam)
- [ ] Early stopping, learning rate finding, warmup and decay schedules
- [ ] Gradient clipping
- [ ] Batch size effects, linear scaling rule, gradient accumulation
- [ ] Mixed precision training: fp16, bf16, loss scaling
- [ ] Reading loss curves like an X-ray: what divergence, plateaus, and spikes each mean
- [ ] Overfit a single batch first — the debugging discipline that saves weeks

### 4.3 PyTorch properly `[TOOL, but the deepest tool]`
- [ ] Tensors, devices, dtypes, `.to()`, memory management
- [ ] `autograd`: `requires_grad`, `backward()`, `grad_fn`, `no_grad`, `detach`
- [ ] `nn.Module`, parameters, buffers, `state_dict`
- [ ] `Dataset`, `DataLoader`, samplers, collate functions, `num_workers`
- [ ] Optimisers and schedulers
- [ ] Custom layers, custom loss functions, custom autograd `Function`
- [ ] Hooks for inspecting activations and gradients
- [ ] Checkpointing, reproducibility, seeding
- [ ] Profiling: `torch.profiler`, finding the actual bottleneck
- [ ] `torch.compile`, TorchScript, graph mode
- [ ] Distributed: DataParallel vs DistributedDataParallel, FSDP, ZeRO stages

### 4.4 Architectures
- [ ] CNNs: convolution arithmetic, padding, stride, dilation, receptive field, pooling
- [ ] Classic CNN lineage: LeNet → AlexNet → VGG → ResNet (residual connections are load-bearing everywhere now) → EfficientNet
- [ ] Transfer learning, feature extraction vs fine-tuning, freezing strategies
- [ ] RNNs, the vanishing gradient problem in sequences, LSTM and GRU gating
- [ ] Seq2seq and the original attention mechanism (Bahdanau) — the direct ancestor of everything
- [ ] Autoencoders, denoising autoencoders, VAEs (ELBO, reparameterisation trick)
- [ ] GANs: minimax objective, mode collapse, training instability
- [ ] Diffusion models: forward/reverse process, DDPM, DDIM, classifier-free guidance, flow matching
- [ ] Graph Neural Networks: message passing, GCN, GAT
- [ ] Vision Transformers, CLIP, contrastive learning
- [ ] Embeddings: what they are geometrically, contrastive objectives, InfoNCE

### 4.5 Reinforcement Learning fundamentals
Needed later for RLHF/GRPO. Don't skip it and then pretend to understand alignment.
- [ ] MDPs: states, actions, rewards, transitions, discounting
- [ ] Value functions, Q-functions, Bellman equations
- [ ] Dynamic programming: policy iteration, value iteration
- [ ] Monte Carlo methods, temporal difference learning, TD(λ)
- [ ] Q-learning, SARSA, DQN and its tricks (replay buffer, target network)
- [ ] Policy gradients, REINFORCE, the variance problem
- [ ] Actor–critic, A2C/A3C, advantage estimation, GAE
- [ ] **PPO** — clipped objective, KL penalty (this is what RLHF runs on)
- [ ] Exploration vs exploitation, entropy bonuses
- [ ] Offline RL and why it's hard

> **Resources:**
> **Primary (do this one first, all of it):** Andrej Karpathy, *Neural Networks: Zero to Hero* — free YouTube series. Build micrograd, then makemore, then GPT. This is the highest-value 40 hours in this entire document.
> **Theory spine:** *Understanding Deep Learning* — Simon J.D. Prince (free PDF). The best modern DL textbook; the maths is clean and the figures are outstanding.
> **RL:** *Reinforcement Learning: An Introduction*, 2nd ed — Sutton & Barto (free PDF), chapters 1–13.

**Proof Gate — Phase 4:**
Three deliverables: (1) your own autograd engine + MLP, in NumPy, training MNIST to >97% with no framework; (2) a ResNet trained from scratch in PyTorch on CIFAR-10 with a written analysis of every training-dynamics decision you made; (3) a written post-mortem of a training run you deliberately broke — bad init, no warmup, wrong LR — explaining the loss curve of each failure. That third one is what nobody does and what interviewers love.

---

## PHASE 5 — NLP, Transformers & LLM Internals `[CORE]` — 3–4 months

This is where you go from "uses AI" to "understands AI." It is the single highest-leverage phase for your target salary.

### 5.1 NLP foundations (fast — know what came before)
- [ ] Tokenisation history: whitespace → word → subword
- [ ] BPE, WordPiece, Unigram, SentencePiece — implement BPE from scratch
- [ ] Vocabulary size tradeoffs, special tokens, chat templates
- [ ] Why tokenisation causes: bad arithmetic, poor non-English performance, weird prompt sensitivity
- [ ] Word2Vec (CBOW, skip-gram, negative sampling), GloVe, FastText
- [ ] Contextual embeddings: ELMo → BERT
- [ ] Classic tasks: NER, POS, coreference, sentiment, summarisation, QA
- [ ] Evaluation metrics: BLEU, ROUGE, METEOR, BERTScore — and why they're all inadequate

### 5.2 The Transformer, built from zero
- [ ] Self-attention: query, key, value — derive it, don't memorise the diagram
- [ ] Scaled dot-product attention and why the √d scaling exists
- [ ] Multi-head attention: what each head can specialise in
- [ ] Positional encoding: sinusoidal → learned → **RoPE** → ALiBi; length extrapolation
- [ ] Feed-forward blocks, expansion ratio, SwiGLU
- [ ] Residual connections and normalisation placement (pre-LN vs post-LN and training stability)
- [ ] Causal masking; encoder vs decoder vs encoder-decoder
- [ ] The full forward pass, by hand, on a 2-token sequence, on paper
- [ ] **Implement GPT-2 from scratch in PyTorch and train it on a small corpus**
- [ ] KV cache: what it stores, why it dominates inference memory
- [ ] Attention variants: MHA → MQA → **GQA**; sliding window; sparse attention
- [ ] FlashAttention: the tiling/IO-awareness idea (understand the memory hierarchy argument)
- [ ] Mixture of Experts: routing, load balancing, capacity factor, why MoE wins on cost
- [ ] State-space models (Mamba, SSMs) — the main live alternative to attention
- [ ] Long-context techniques and their real limitations

### 5.3 How LLMs are actually built
- [ ] Pretraining objective: next-token prediction, causal LM vs masked LM
- [ ] Pretraining data: Common Crawl, deduplication, quality filtering, decontamination
- [ ] Data mixtures and curriculum
- [ ] **Scaling laws:** Kaplan et al., Chinchilla-optimal, compute-optimal vs inference-optimal training
- [ ] Compute budgeting: FLOPs estimation, the `6ND` rule of thumb
- [ ] Distributed training: data / tensor / pipeline / sequence parallelism, ZeRO, FSDP
- [ ] Training instabilities: loss spikes, divergence, how labs actually handle them
- [ ] Post-training pipeline overview: SFT → preference optimisation → RL → distillation
- [ ] Sampling and decoding: greedy, beam search, temperature, top-k, top-p/nucleus, min-p, repetition penalty, speculative decoding
- [ ] Structured/constrained decoding: grammars, JSON schema enforcement, logit biasing
- [ ] Emergent abilities and the measurement critique of them
- [ ] Reasoning models: chain-of-thought, test-time compute scaling, RL on verifiable rewards
- [ ] Multimodality: vision encoders, projection layers, interleaved training
- [ ] Hallucination — the mechanistic explanations, not just the word
- [ ] Interpretability: probing, attention analysis, superposition, sparse autoencoders, circuits

> **Resources:**
> **Ramp:** Karpathy's *Let's build GPT* + `nanoGPT` repo (already in Phase 4's series — this is the bridge).
> **The top-1% gate:** **Stanford CS336 — Language Modeling from Scratch.** Spring 2026 lectures are free on YouTube; assignments are public on GitHub (`github.com/stanford-cs336`). You build a tokenizer, a full LM, FlashAttention in Triton, distributed training, scaling-law experiments, data pipelines, and alignment. Assignments 1, 2, 4 and 5 are fully doable outside Stanford; assignment 3 partially. **Completing CS336 assignments 1 and 2 alone puts you above the overwhelming majority of working "AI engineers."** Budget 3 months. It needs an NVIDIA GPU on Linux — rent one (RunPod/Lambda/Vast) rather than buying.

**Proof Gate — Phase 5:**
A public repo containing: your own BPE tokenizer, your own transformer implementation trained to a sensible loss on a real corpus, a written scaling-law mini-experiment (train 4 model sizes, fit the curve, predict the 5th, check it), and a blog post explaining KV cache memory maths for a given model size and context length. Then reproduce one paper's result end-to-end.

---

## PHASE 6 — AI Engineering: Building Real LLM Systems `[CORE + TOOL]` — 3 months

You have a head start here (your RAG project, text-to-SQL package, MCP work). This phase makes it rigorous. Note the ordering principle the whole industry converged on:

> **Prompt → Retrieval → Fine-tune → Distil.** Reach for the next one only when the previous one demonstrably fails. Retrieval fixes *knowledge*. Fine-tuning fixes *behaviour*. Most teams reach for fine-tuning when they had a retrieval problem, and burn six figures learning that.

### 6.1 Working with foundation models
- [ ] Model selection: capability vs latency vs cost vs privacy vs licence
- [ ] Open-weight vs API models — the honest tradeoff matrix
- [ ] Prompting techniques: zero-shot, few-shot, chain-of-thought, self-consistency, ReAct, reflection
- [ ] System prompts, role design, instruction hierarchy
- [ ] Structured outputs: JSON mode, function/tool schemas, constrained decoding, Pydantic validation loops
- [ ] Context engineering: what to put in the window, in what order, and why position matters
- [ ] Prompt versioning, prompt registries, treating prompts as versioned code artifacts
- [ ] Caching: prompt caching, semantic caching, exact-match caching
- [ ] Token accounting and cost modelling per request and per user
- [ ] Latency budgeting: TTFT vs TPOT, streaming, perceived latency

### 6.2 Retrieval (RAG) — beyond the tutorial version
- [ ] Embedding models: how they're trained, dimensions, domain fit, when to fine-tune one
- [ ] Chunking strategies: fixed, recursive, semantic, structural, late chunking — and measuring which is right
- [ ] Vector indexes: flat, IVF, HNSW, PQ — recall/latency/memory tradeoffs (you already know indexes; this is the same thinking)
- [ ] `pgvector` in production: index tuning, filtering, hybrid queries, scaling limits
- [ ] Hybrid search: BM25 + dense, reciprocal rank fusion
- [ ] Re-ranking: cross-encoders, listwise rerankers, latency cost
- [ ] Query transformation: rewriting, decomposition, HyDE, multi-query
- [ ] Metadata filtering and access control **inside** retrieval (multi-tenant RAG — your domain)
- [ ] GraphRAG and relational/structured retrieval (directly relevant to your industry-relational RAG project)
- [ ] Text-to-SQL as retrieval: schema linking, safety, verification (your existing package)
- [ ] Retrieval evaluation: recall@k, MRR, NDCG, context precision/recall — measured separately from generation quality
- [ ] Incremental indexing, freshness, deletion, re-embedding on model change

### 6.3 Agents
- [ ] Tool/function calling mechanics and schema design
- [ ] The agent loop: plan → act → observe → repeat; termination conditions
- [ ] Single agent vs multi-agent — and the honest case that multi-agent is usually premature
- [ ] Memory: short-term, episodic, long-term, summarisation strategies
- [ ] **MCP (Model Context Protocol)**: servers, tools, resources, transport, auth
- [ ] Orchestration: state machines and graphs over free-form loops (LangGraph or your own — your modular-monolith instinct is right here)
- [ ] Failure modes: infinite loops, tool misuse, context poisoning, error cascades
- [ ] Human-in-the-loop: approval gates, interruption, resumption
- [ ] Sandboxing and least-privilege tool design
- [ ] Cost and step-count budgets as first-class controls
- [ ] Computer-use / browser agents and their specific risks

### 6.4 Evaluation — the #1 hiring differentiator in 2026
If you become genuinely excellent at exactly one thing in this phase, make it this. Everyone can build a demo. Almost nobody can prove it works.
- [ ] Building an eval set: from real traffic, not from imagination
- [ ] Golden datasets, annotation guidelines, inter-annotator agreement
- [ ] Deterministic checks first: schema validation, regex, unit tests, business-rule assertions
- [ ] LLM-as-judge: rubric design, position bias, verbosity bias, judge calibration against humans
- [ ] Pairwise comparison and Elo-style ranking
- [ ] Component-level evals vs end-to-end evals (evaluate retrieval and generation separately)
- [ ] Regression testing for prompts and models; CI gates on eval scores
- [ ] Offline eval vs online eval; shadow deployment; A/B testing LLM features
- [ ] Statistical rigour: is your 3% improvement real? (Phase 2.4 pays off here)
- [ ] Production feedback loops: implicit signals, thumbs, escalations
- [ ] Observability: tracing spans, token counts, latency percentiles, cost per trace

### 6.5 Safety, security & guardrails `[CORE]`
Directly aligned with how you already build. This is a genuine specialisation premium.
- [ ] **OWASP Top 10 for LLM Applications** — work through all ten
- [ ] Prompt injection: direct, indirect, via retrieved documents, via tool outputs
- [ ] Why prompt injection is not solvable by prompting — architectural mitigations only
- [ ] Data exfiltration through tool use and rendered content
- [ ] Jailbreaks and defence-in-depth
- [ ] Input/output guardrails, classifier layers, canary tokens
- [ ] PII detection and redaction in prompts, logs, and traces
- [ ] Multi-tenant isolation for embeddings and retrieval
- [ ] Model/supply-chain risk: poisoned weights, malicious datasets, dependency risk
- [ ] Privilege separation: never let an LLM hold credentials it can be talked into using
- [ ] Compliance surfaces: GDPR, India's DPDP Act, EU AI Act obligations, audit logging
- [ ] Content safety, refusal behaviour, red-teaming your own system

> **Resource:** *AI Engineering* — Chip Huyen (2025). This is the definitive book for this phase; read it cover to cover. Supplement with the OWASP LLM Top 10 (free) and the official Anthropic/OpenAI engineering docs for current API-layer specifics.

**Proof Gate — Phase 6:**
Take your existing RAG project and make it *provable*: a versioned eval suite with at least 200 real examples, separate retrieval and generation metrics, an LLM-judge calibrated against your own human labels, CI that blocks merges on regression, full tracing, a documented threat model with implemented mitigations, and a cost-per-query dashboard. Then write a post: "How I measured whether my RAG system actually works." That post will get you interviews on its own.

---

## PHASE 7 — Training, Fine-Tuning & Alignment `[CORE]` — 3 months

The point of this phase is not "learn to fine-tune." It is to **know when fine-tuning is the wrong answer**, and to execute it properly on the minority of occasions when it's the right one.

### 7.1 Deciding to fine-tune at all
- [ ] The decision tree: prompt → few-shot → RAG → fine-tune → continued pretraining → train from scratch
- [ ] What fine-tuning genuinely fixes: format consistency, tone/style, domain terminology, latency (smaller model), cost
- [ ] What it does not fix: missing knowledge, factuality, reasoning depth
- [ ] Catastrophic forgetting and capability regression
- [ ] Total cost of ownership: data labelling, compute, eval, retraining on model upgrades, serving

### 7.2 Data — where fine-tuning actually succeeds or fails
- [ ] Instruction dataset design and format
- [ ] Data quality over quantity: 1,000 excellent examples beat 100,000 mediocre ones
- [ ] Synthetic data generation, self-instruct, distillation from a stronger model
- [ ] Deduplication, decontamination against your eval set, filtering
- [ ] Human annotation workflows, guidelines, adjudication
- [ ] Preference data collection for alignment
- [ ] Dataset versioning and lineage

### 7.3 Supervised fine-tuning (SFT)
- [ ] Full fine-tuning: when it's justified, memory maths (params + grads + optimiser states)
- [ ] **PEFT** family: adapters, prefix tuning, prompt tuning, IA³
- [ ] **LoRA** — derive it from the low-rank idea in Phase 2.1; rank, alpha, target modules
- [ ] **QLoRA**: 4-bit NF4 quantisation, double quantisation, paged optimisers
- [ ] DoRA and newer variants
- [ ] Merging adapters; serving many adapters over one base model
- [ ] Model merging: task arithmetic, TIES, DARE, SLERP
- [ ] Hyperparameters that matter: LR, epochs, packing, masking the prompt, gradient accumulation
- [ ] Multi-GPU: FSDP, DeepSpeed ZeRO, gradient checkpointing
- [ ] Practical stacks: Hugging Face `transformers` + `peft` + `trl`; Axolotl or Unsloth for speed

### 7.4 Alignment & preference optimisation
- [ ] RLHF pipeline: SFT → reward model → PPO
- [ ] Reward model training, reward hacking, over-optimisation
- [ ] **DPO** — derive why it removes the explicit reward model; the implicit KL constraint
- [ ] Variants: IPO, KTO, ORPO, SimPO
- [ ] **GRPO** and RL on verifiable rewards (maths, code, tool use) — the reasoning-model recipe
- [ ] Constitutional AI / RLAIF
- [ ] Rejection sampling / best-of-n as cheap alignment
- [ ] The KL-divergence budget: staying close to the reference policy (Phase 2.5 pays off)
- [ ] Evaluating alignment: helpfulness vs harmlessness tradeoffs, refusal calibration

### 7.5 Efficiency
- [ ] Quantisation: PTQ vs QAT; INT8, INT4, GPTQ, AWQ, GGUF, FP8
- [ ] Knowledge distillation: response-based, feature-based, self-distillation
- [ ] Pruning: structured, unstructured, magnitude vs movement
- [ ] Speculative decoding and draft models
- [ ] Small language models: the case for a fine-tuned 3–8B over a frontier API

> **Resource:** Hugging Face's official course track — the `transformers`, `peft`, `trl` and alignment chapters — worked end-to-end on rented GPUs. Then **CS336 Assignment 5 (alignment)** for the from-scratch version. Read the LoRA, QLoRA, InstructGPT and DPO papers directly; they're all readable.

**Proof Gate — Phase 7:**
Fine-tune a small open model on a genuinely proprietary task (your SCADA/telemetry domain again — nobody else has this data) and publish: the dataset construction methodology, an ablation across 3 LoRA configurations, an eval showing your 7B fine-tune beating a frontier model on *your* task at 1/20th the cost, and an honest section on where it's still worse. That artifact is a job offer.

---

## PHASE 8 — Inference, Serving & Systems `[CORE + TOOL]` — 2 months

This is your natural home turf. Lean in — it's where your backend background becomes an unfair advantage.

### 8.1 Hardware & performance reasoning
- [ ] GPU architecture basics: SMs, warps, memory hierarchy (HBM vs SRAM)
- [ ] Arithmetic intensity, the roofline model, memory-bound vs compute-bound
- [ ] Why LLM decoding is memory-bandwidth-bound — the single most important serving fact
- [ ] VRAM maths: weights + KV cache + activations, for a given model/batch/context
- [ ] CUDA and Triton — conceptual literacy; write at least one Triton kernel
- [ ] TPUs, inference accelerators, CPU inference

### 8.2 Serving
- [ ] Batching: static, dynamic, **continuous/in-flight batching**
- [ ] PagedAttention and KV-cache management
- [ ] Prefill vs decode; disaggregated serving
- [ ] Throughput vs latency tradeoff curves; SLO-driven capacity planning
- [ ] Serving stacks: vLLM (default), SGLang, TensorRT-LLM, llama.cpp/Ollama for local
- [ ] Multi-adapter serving (LoRA hot-swapping)
- [ ] Autoscaling GPU workloads, cold starts, spot instances
- [ ] Routing and cascades: cheap model first, escalate on uncertainty
- [ ] Streaming, backpressure, timeouts, circuit breakers, graceful degradation — you already know these; apply them here

### 8.3 The classical-ML serving path (don't lose this)
- [ ] Model packaging: ONNX, TorchScript, safetensors
- [ ] Serving frameworks: BentoML, Triton Inference Server, Ray Serve
- [ ] Batch vs real-time vs streaming inference
- [ ] Feature stores and training/serving skew

> **Resource:** The vLLM documentation and design blog posts, read as engineering literature rather than a manual — plus the FlashAttention and PagedAttention papers. For deep GPU work, *Programming Massively Parallel Processors* (Kirk & Hwu), chapters 1–7.

**Proof Gate — Phase 8:**
Publish a benchmarking study: same model, three serving configurations, measured on throughput, p50/p95/p99 latency, cost per million tokens, and GPU utilisation — with an explanation grounded in the roofline model of *why* the numbers came out that way. Include a capacity-planning model for a stated SLO.

---

## PHASE 9 — MLOps, LLMOps & Data Engineering `[CORE + TOOL]` — 2 months

Distinction worth internalising: **MLOps** is operations around models you *train*. **LLMOps** is operations around models you *call*. You will do both; your spine is weighted toward LLMOps.

### 9.1 Data engineering
- [ ] Batch vs streaming; the Lambda/Kappa debate
- [ ] Orchestration: Airflow, Dagster, or Prefect — pick one, learn it properly
- [ ] Data warehouses vs lakes vs lakehouses; Parquet, Iceberg, Delta
- [ ] dbt and transformation-as-code
- [ ] Kafka for ML pipelines (you already have this)
- [ ] Data contracts, schema evolution, quality checks (Great Expectations)
- [ ] Data versioning: DVC, LakeFS
- [ ] CDC and incremental processing

### 9.2 ML lifecycle
- [ ] Experiment tracking: MLflow or Weights & Biases — pick one
- [ ] Model registry, versioning, lineage, reproducibility
- [ ] Training pipelines as code; CI/CD for models
- [ ] Deployment strategies: shadow, canary, blue-green, progressive rollout
- [ ] Monitoring: data drift, concept drift, prediction drift, performance decay
- [ ] Automated retraining triggers and guardrails
- [ ] Cost attribution and FinOps for GPU workloads
- [ ] Incident response for ML systems; rollback plans

### 9.3 LLMOps specifics
- [ ] Tracing: LangSmith, Langfuse, OpenTelemetry GenAI conventions
- [ ] Prompt/version management with rollback
- [ ] Online eval and continuous eval pipelines
- [ ] Token/cost/latency budgets enforced in code
- [ ] Rate limiting, quota management, provider failover
- [ ] Model migration playbook: how to safely move from model vN to vN+1 (this will happen to you 4× in 5 years — a documented playbook is a career asset)

### 9.4 Infrastructure
- [ ] Kubernetes fundamentals + GPU scheduling
- [ ] Terraform / IaC
- [ ] One cloud, deeply: AWS (SageMaker, Bedrock) or GCP (Vertex) — pick one
- [ ] Secrets, IAM, network isolation for AI workloads

> **Resources:** *Designing Machine Learning Systems* — Chip Huyen (the ML systems spine) and *Designing Data-Intensive Applications* — Martin Kleppmann (you'll already know parts; the rest is permanently valuable). *Fundamentals of Data Engineering* (Reis & Housley) if the data layer feels thin.

**Proof Gate — Phase 9:**
One of your existing projects, fully industrialised: IaC-provisioned, CI/CD with eval gates, tracing, drift monitoring with alerts, cost dashboards, a documented runbook, and a load test. Then deliberately break it in three ways and document the detection-and-recovery for each.

---

## PHASE 10 — Specialisation, Research Literacy & Top-1% Behaviour `[CORE]` — ongoing forever

Phases 1–9 make you excellent. Phase 10 is what makes you rare. It never ends and it starts the day you finish Phase 5.

### 10.1 Reading research properly
- [ ] The three-pass method for reading a paper (skim → understand → reproduce)
- [ ] Reading a results table sceptically: baselines, ablations, cherry-picking, seed variance
- [ ] Following the actual signal: NeurIPS/ICML/ICLR/ACL, arXiv daily in your niche, lab technical reports
- [ ] Reproducing at least 4 papers per year, end to end, publicly
- [ ] Keeping a paper journal: one paragraph on what you'd have done differently

**Core paper list — read these directly, in this order:**
- [ ] Attention Is All You Need (2017)
- [ ] BERT (2018)
- [ ] GPT-2 / GPT-3 (2019, 2020)
- [ ] Scaling Laws (Kaplan 2020) + Chinchilla (Hoffmann 2022)
- [ ] InstructGPT / RLHF (2022)
- [ ] Chain-of-Thought (2022)
- [ ] LoRA (2021) + QLoRA (2023)
- [ ] RAG (Lewis 2020)
- [ ] FlashAttention (2022) + PagedAttention/vLLM (2023)
- [ ] Constitutional AI (2022)
- [ ] DPO (2023)
- [ ] Mixtral / MoE routing (2024)
- [ ] Toolformer + ReAct (2022–23)
- [ ] Mamba / SSMs (2023)
- [ ] Whatever the current reasoning-model technical report is when you get here

### 10.2 Choosing your niche (do this around month 15)
Pick **one**. The premium comes from depth nobody else has:
- [ ] **Industrial / IoT / SCADA AI** — anomaly detection, predictive maintenance, time-series foundation models, edge inference. *This is your strongest option: you have five years of domain context that no AI-native competitor can acquire quickly.*
- [ ] LLM inference optimisation & serving infrastructure
- [ ] Retrieval systems and enterprise knowledge infrastructure
- [ ] Agent reliability, evaluation and safety engineering
- [ ] Fine-tuning / model adaptation as a specialty
- [ ] AI security & red-teaming

### 10.3 Top-1% behaviours (these are the actual differentiators)
- [ ] Write publicly — one substantial technical post per month, minimum. Depth beats frequency.
- [ ] Ship open source — a genuinely useful package with real users beats 20 tutorial repos. (Your text-to-SQL safety package is a strong candidate; harden it and promote it.)
- [ ] Reproduce and extend papers publicly
- [ ] Build things that solve real business problems, not chatbot demos — you already believe this; keep it
- [ ] Learn to say "I don't know, here's how I'd find out" and to change your mind publicly
- [ ] Teach: talks, workshops, mentoring. Teaching exposes every gap you have.
- [ ] Measure everything you claim. "It's better" is worthless; "it's 23% better on this eval, here's the CI" is a career.
- [ ] Develop taste: knowing what not to build is worth more than the ability to build anything.

---

## CROSS-CUTTING TRACKS (run these throughout, never as separate phases)

### Track A — Software engineering excellence `[CORE]`

You have most of this. Keep it sharp; it's the moat.

- [ ] System design for AI systems specifically (latency budgets, failure modes, cost)
- [ ] DDIA-level distributed systems reasoning
- [ ] DSA maintenance: 2 problems/week, forever, for interviews and for taste
- [ ] Security engineering habits
- [ ] Writing: design docs, RFCs, post-mortems. Your writing quality caps your seniority.

### Track B — Portfolio `[CORE]`

Target by month 24: five deep projects, not fifteen shallow ones.

1. Production RAG with a rigorous eval suite (Phase 6 gate)
2. Domain-specific fine-tuned model beating a frontier model on your task (Phase 7 gate)
3. An ML system on genuinely proprietary industrial data (Phase 3 gate, upgraded)
4. An open-source tool with real users (your SQL-safety package)
5. A from-scratch implementation showing depth (your transformer / CS336 work)

Every project needs: a README that argues rather than describes, an eval showing it works, a threat model, a cost analysis, and a written post-mortem of what you got wrong.

### Track C — Career & compensation `[CORE]`

Let me be direct about the money, since it's your stated goal.

- The compensation premium does not come from knowing more topics. It comes from being the person who can be trusted with a system that costs real money if it fails. Everything in this roadmap is in service of that.
- The three multipliers, in order of impact: (1) demonstrated production ownership, (2) a scarce specialisation, (3) visible public work that lets people evaluate you before they meet you.
- Your realistic ladder: Backend Engineer → AI/Backend Engineer (months 6–12, achievable at your current employer or a switch) → AI Engineer (months 12–24) → Senior AI Platform / ML Engineer (months 24–36). Each rung is roughly a step change in comp; the largest jumps in the Indian market come from switching to a global-remote or product-company role, not from internal increments.
- I'm deliberately not giving you salary numbers. Ranges shift fast, they vary enormously by company type and location, and a number from me would be less accurate than 30 minutes on levels.fyi and 3 conversations with recruiters. Do that in month 6 and again in month 18.
- Do not wait 24 months to start applying the label. From month 6, you are an AI engineer who is still deepening. Ship AI work inside your current job as early as possible — real production experience with real traffic outranks any amount of study.

- [ ] Month 3: rewrite your CV around shipped systems and metrics, not technologies
- [ ] Month 6: get one AI feature into production at work, with an eval
- [ ] Month 6: research the market properly; set a concrete comp target
- [ ] Month 9: first substantial public blog post
- [ ] Month 12: first interviews — even if you don't intend to move. Interviews are the only honest diagnostic.
- [ ] Month 15: choose your niche; start being visible in it
- [ ] Month 18: open-source tool with real users
- [ ] Month 24: reassess. You should be interviewing at a materially different level.

---

## REVIEW & CALIBRATION

Every Sunday (1 hr): pick one topic from 3+ weeks ago. Re-derive or re-implement it from memory. If you can't, it isn't learned — put it back in the queue. This spaced-retrieval habit is worth more than any two of the phases above.

Every 3 months: re-read the "Durable core vs churn layer" table. Ask honestly: what fraction of my last 12 weeks went to the left column? If it's under 60%, correct.

Every 6 months: update the churn-layer sections of this document yourself. Frameworks will have changed. If you can confidently rewrite the tool sections, you've internalised the core. That is what makes this roadmap survive five years — not that the tools stay the same, but that you become the person who can update it.

---

## ANTI-PATTERNS — the ways this goes wrong

- Tutorial hell. If you finish a tutorial and haven't broken anything, you learned nothing. Always modify the thing until it fails.
- Resource hoarding. One resource per topic. Finish it. Bookmarking is not learning.
- Waiting until you "know enough" to build. You will never feel ready. Build at 60% understanding; the remaining 40% arrives through the build.
- Skipping the maths and planning to come back. Nobody comes back. This is why the maths runs in parallel from week one.
- Chasing every new model release. Read the technical report, note what's genuinely new, move on. Most releases change nothing about what you should study.
- Building demos instead of systems. A chatbot that works for you is not evidence. A system with evals, monitoring, and a cost model is.
- Studying instead of shipping at work. Production experience compounds faster than study. Get AI into your day job in month 6, not month 24.
- Comparing your month 4 to someone's year 6. The comparison that matters is against your own month 1.
- Perfectionism on the roadmap itself. Falling two weeks behind is normal. Rewriting the plan every month is procrastination.
- Optimising for breadth because it feels safer. It isn't. Depth in one lane plus literacy elsewhere is both safer and better paid.

---

## THE HONEST SUMMARY

- Months 0–6: Python + NumPy fluency, maths running in parallel, classical ML started, first AI feature shipped at work.
- Months 6–12: Classical ML complete with a real project, deep learning foundations, autograd and transformer built from scratch.
- Months 12–18: CS336-level LLM internals, rigorous AI engineering with real evals, first fine-tune, public writing begins.
- Months 18–24: Serving and inference depth, MLOps/LLMOps, niche chosen, open-source tool shipped, interviewing at a new level.
- Months 24+: Specialisation depth, research literacy, teaching, and the compounding phase where each new thing takes a quarter of the time it used to.

You will not finish this on schedule. Nobody does. Finishing 70% of it properly puts you well inside the top few percent of practitioners, because the median "AI engineer" in 2026 has done Phase 6 and none of Phases 2, 4, 5, 7 or 8.

The gap between good and top-1% is not more topics. It is depth, evidence, and taste — and all three come from building real things, measuring them honestly, and being willing to find out you were wrong.

Start with Phase 0 this week. Commit the gap assessment. Then Phase 1.
