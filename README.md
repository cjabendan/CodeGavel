# CodeGavel

**CodeGavel** is a lightweight, local-first examination and hands-on laboratory platform built specifically for **C Programming** classes. Designed for offline LAN deployment in university computer labs, CodeGavel provides automated problem distribution, sandboxed C compilation, real-time teacher controls, and robust strike-based anti-cheat enforcement—without requiring external internet access.

---

## Key Features

- **C-Only Execution Engine**: Native compilation and test-case execution for C source code using localized GCC environments or sandboxed Docker containers.
- **Roster & Problem Management**:
  - Bulk import student rosters (`.xlsx`, `.csv`) with support for Name, Student ID, Year, and Section.
  - Bulk import exam problem sets with hidden test cases and custom output matching.
  - Automated per-student problem shuffling using Fisher-Yates randomization.
- **Anti-Cheat Signal & Lockout**:
  - Detection for page visibility, window blur, mouse-leave from editor boundaries, and DevTools shortcuts.
  - Server-side strike coalescing (1-second deduplication) with a 3-strike atomic lockout policy.
  - Auto-submission on lockout, pause, or timer expiry.
- **Real-Time Teacher Controls**:
  - Active session monitoring, instant strike clearing, manual attempt resets, and group-wide pause/resume triggers over Server-Sent Events (SSE).
- **Zero-Internet Local LAN Architecture**:
  - Single executable PocketBase backend running seamlessly on Windows host machines.
  - Fully functional over local router/switch networks without internet connection.

---

## Tech Stack & Architecture

| Domain | Technology / Tool | Role |
| :--- | :--- | :--- |
| **Backend & Database** | **PocketBase (v0.22+)** | Embedded SQLite DB, real-time SSE subscriptions, auth, and REST endpoints. |
| **Frontend Framework** | **React 18 + Vite + TypeScript** | High-performance student and teacher dashboard SPA. |
| **UI & Styling** | **Tailwind CSS + shadcn/ui** | Responsive, accessible, and clean user interface components. |
| **Code Editor** | **Monaco Editor (`@monaco-editor/react`)** | Desktop-grade C code editor with syntax highlighting and line numbers. |
| **Execution Engine** | **Node.js + GCC (MinGW / Docker)** | Local sandboxed runner for compiling and evaluating student C submissions. |
| **Data Parsing** | **SheetJS (`xlsx`)** | Server/client-side parsing of roster spreadsheets and problem set files. |

---

## System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **Node.js**: v20.19.0 or newer
- **Package Manager**: `pnpm` (v9/v10/v11) or `npm`
- **Compiler**: GCC via MinGW-w64 or Docker Desktop for Windows

---

## Installation & First-Time Setup

### 1. Clone the Repository & Install Dependencies

```cmd
git clone https://github.com/your-repo/CodeGavel.git
cd CodeGavel
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file and update your host's local IP address:

```cmd
cp .env.example .env
```

Edit `.env`:

```env
PORT=8090
HOST_LAN_IP=192.168.1.100
POCKETBASE_URL=http://127.0.0.1:8090
SECRET_KEY=your_secure_local_secret
```

### 3. Bootstrap PocketBase

Download and setup PocketBase for Windows:

```cmd
pnpm pocketbase:setup
pnpm pocketbase:bootstrap
```

### 4. Build Frontend Assets

```cmd
pnpm build
```

---

## Running CodeGavel in Class

Start the main PocketBase service and the C execution runner in separate terminal windows:

### Terminal 1: Database & API Server
```cmd
pnpm pocketbase:serve
```

### Terminal 2: C Compilation Worker
```cmd
pnpm worker:serve
```

### Access Points
- **Teacher Portal**: `http://127.0.0.1:8090/admin` or `http://<HOST_LAN_IP>:8090/admin`
- **Student Exam Terminal**: `http://<HOST_LAN_IP>:8090/exam`

---

## Verification & Testing

Verify that your host machine meets performance requirements before running live exams:

```cmd
pnpm test          # Unit and component tests
pnpm lint          # Code style and syntax check
pnpm typecheck     # TypeScript compiler check
pnpm test:e2e      # End-to-end exam simulation
```

---

## License & Security Boundary

CodeGavel is designed for local-first, single-sub-network deployments. Do not expose the administration portal directly to the public internet without proper reverse-proxy authentication and SSL/TLS wrapping.
