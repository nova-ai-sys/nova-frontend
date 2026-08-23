# Changelog

## 0.1.0 (2026-08-23)


### ⚠ BREAKING CHANGES

* this app no longer serves the landing page, and no longer signs users in. It expects an unauthenticated nova-api at VITE_API_URL, or at

### Features

* **a2a:** A2A orchestrator — planner, executor, budgets and live run diagrams ([#15](https://github.com/nova-ai-sys/nova-frontend/issues/15)) ([3817587](https://github.com/nova-ai-sys/nova-frontend/commit/3817587594b3123e2915337dab197751740f6d71))
* add deployment pipeline and nginx configs for portfolio integration ([5772b4c](https://github.com/nova-ai-sys/nova-frontend/commit/5772b4c8ad1fb5c6c30c9ff3262e9faf6056a9e7))
* add MCP server, Streamlit UI, tool modules, and full documentation ([52c30b6](https://github.com/nova-ai-sys/nova-frontend/commit/52c30b61817e0644b8c5480ea9f9a4a55d2f5482))
* add settings panel with language switcher and provider selection ([1e4f1ce](https://github.com/nova-ai-sys/nova-frontend/commit/1e4f1ced78b6df886df312a007765ec4b806bb89))
* added landing page ([6c20dec](https://github.com/nova-ai-sys/nova-frontend/commit/6c20decd15eddde25a4ae76308b10a0afe03d641))
* auth system (Cognito), user profiles, API keys, and GPU scaling ([f3dc5a4](https://github.com/nova-ai-sys/nova-frontend/commit/f3dc5a43508be8ce9cc78106582deb3aae42d72d))
* changed to new rebrand ([#17](https://github.com/nova-ai-sys/nova-frontend/issues/17)) ([ccfd96c](https://github.com/nova-ai-sys/nova-frontend/commit/ccfd96c22ae5ba70a25b9fd7f21363991ebd7843))
* implemented history, folders, memory and tool for token count ([5a14bd6](https://github.com/nova-ai-sys/nova-frontend/commit/5a14bd6a99e497abce14097c9cea26305a07d921))
* **k8s:** add AWS EKS deployment with CI/CD pipeline ([d32e121](https://github.com/nova-ai-sys/nova-frontend/commit/d32e121a8bee078f0373a01d392f98b6e136b3fd))
* **mcp-connections:** added connections to Google, Microsoft and GitHub per user, improved provider selector and overall visibility of the application ([#13](https://github.com/nova-ai-sys/nova-frontend/issues/13)) ([93c880c](https://github.com/nova-ai-sys/nova-frontend/commit/93c880c0b866425acfe8856a960209c35513012e))
* migrate from OpenAI API keys to local Ollama LLM models ([4dd70b7](https://github.com/nova-ai-sys/nova-frontend/commit/4dd70b713cf796ba6a52bb4724481bac428dc327))
* react UI, streaming, MCP client, runtime settings ([eb5e5b6](https://github.com/nova-ai-sys/nova-frontend/commit/eb5e5b6e6c2df711cbd07361ba57b3d18e5be0e5))
* resolved snapshot build ci for roadmap and updated landing page ([e6e9312](https://github.com/nova-ai-sys/nova-frontend/commit/e6e93125755645aaffc5857fd2add0166ee2c5b7))
* split prod (landing showcase) and dev (full chat app) modes ([0bb1760](https://github.com/nova-ai-sys/nova-frontend/commit/0bb17602baf664a1f2df1acd0dc223b0742da74d))
* split the web UI into its own repository ([5660969](https://github.com/nova-ai-sys/nova-frontend/commit/56609699bfa9dd63ee794e6244b3e9e1846f3777))
* translate scheduled tasks panel ([e341883](https://github.com/nova-ai-sys/nova-frontend/commit/e3418839c6ea96cb4d1edfea439bf2ec749b696a))
* **ui:** complete hacker/terminal aesthetic redesign ([cb15cd8](https://github.com/nova-ai-sys/nova-frontend/commit/cb15cd8992e986e6e5e30b0ab3783e82661f3da8))
* unify memory and knowledge base into intelligence panel ([c429e4a](https://github.com/nova-ai-sys/nova-frontend/commit/c429e4ae8b53a3b154842e45b010a57b8f09d694))
* unify sidebar navigation with intelligence and settings ([1f650f6](https://github.com/nova-ai-sys/nova-frontend/commit/1f650f64eb142ac8bc7cdd582198f2321148bf64))
* updated landing page and documentation ([2045b15](https://github.com/nova-ai-sys/nova-frontend/commit/2045b155afb880eed972c9f1500288de32f84723))
* **US1:** conversational memory - fact extraction, episodic memory, memory context injection, API routes and UI ([862c67e](https://github.com/nova-ai-sys/nova-frontend/commit/862c67e2bdfcf5d1875df35fbede4f309130a8c7))
* **US2:** RAG knowledge base - ChromaDB vector store, document ingestion, rag_search tool, API routes and UI ([07c2293](https://github.com/nova-ai-sys/nova-frontend/commit/07c2293536eabc36bde4b44c6f2a0fc7297692ae))
* **US5:** professional landing page with docs, dynamic GitHub roadmap ([#6](https://github.com/nova-ai-sys/nova-frontend/issues/6)) ([50fe2d1](https://github.com/nova-ai-sys/nova-frontend/commit/50fe2d1dbbcf74db4f2b90e5f0c383cb4fa030d6)), closes [#5](https://github.com/nova-ai-sys/nova-frontend/issues/5)
* **US5:** scheduled tasks - APScheduler manager, CRUD API, execution logs, enhanced health endpoint, and scheduler UI ([08f8c6a](https://github.com/nova-ai-sys/nova-frontend/commit/08f8c6a7544481288e3e7abe4a95447aaef23d49))
* **US6:** intuitive scheduler form + comprehensive documentation for all capabilities ([70ad083](https://github.com/nova-ai-sys/nova-frontend/commit/70ad083a8b04242b53f8d2772f09f939dd635c34))


### Bug Fixes

* created snapshot for better view the roadmap on public landing page ([e6d2bfa](https://github.com/nova-ai-sys/nova-frontend/commit/e6d2bfa2696fcca91054cc973b71e60baeddb9ff))
* **deps:** patch the PDF and dev-server advisories ([8dec256](https://github.com/nova-ai-sys/nova-frontend/commit/8dec2563aec69a26a9c1e3313bc8160d47bee41b))
* **dev:** stop flooding the console when the API is not up yet ([929d39c](https://github.com/nova-ai-sys/nova-frontend/commit/929d39c224847e37b39df94fff9461471315ef42))
* hide native scrollbar arrows across the ui ([cd3a4dc](https://github.com/nova-ai-sys/nova-frontend/commit/cd3a4dc8a91cd40a878b857015992b9ba5781427))
* load chat history from disk and keep chat titles stable ([2902713](https://github.com/nova-ai-sys/nova-frontend/commit/29027139c1f499e34ca2b6bfd19c8eb59bd7bdaf))
* production UI adjustments ([89a1b7b](https://github.com/nova-ai-sys/nova-frontend/commit/89a1b7b8d66dde9a4040ae0d31e2b8097b0e6438))
* restore brand green scrollbar color and robustly hide arrows ([d8899a3](https://github.com/nova-ai-sys/nova-frontend/commit/d8899a3bcd3c2355a117c8dc47b42ec9e3121f5f))


### Documentation

* rewrite the readme and note the commit conventions ([add6d8c](https://github.com/nova-ai-sys/nova-frontend/commit/add6d8cccc3a9bb4927533be3a77ddb69e38407a))
