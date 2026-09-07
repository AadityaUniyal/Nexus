# Contributing to NEXUS

Thank you for your interest in contributing to **NEXUS — Enterprise Autonomous Logistics & Spatial Intelligence Platform**.

---

## 🛠️ Code of Conduct & Development Principles

1. **Deterministic Physics & Safety First**: Mathematical simulation models (aerodynamics, rolling resistance, SLA breach probability) must remain deterministic and verifiable.
2. **Dual-Provider Resilience**: AI services MUST implement graceful failover between Groq (`llama-3.3-70b`) and Google Gemini (`gemini-2.5-flash`).
3. **Zero Mock Policy**: Production UI features must consume live endpoints via `frontend/lib/data-provider.ts` with transparent fallback boundaries.
4. **Strict Concurrency**: Optimistic Concurrency Control (`version` integer locks) must be preserved across all mutated database entities.

---

## 🚀 How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/AadityaUniyal/Nexus.git
cd Nexus
```

### 2. Set Up Environment
```bash
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

### 3. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Code Standards & Verification
Before submitting a Pull Request, ensure all tests pass cleanly:

```bash
# Run pytest backend suite (66/66 tests)
python run.py --test

# Run Next.js frontend compilation
python run.py --compile
```

---

## 📄 Pull Request Guidelines
- Include a descriptive title following Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`).
- Verify that both backend tests pass and Next.js static/dynamic route generation completes without errors.
- Do not commit production API keys or `.env` files into source control.

---

## ⚖️ License
By contributing to NEXUS, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
